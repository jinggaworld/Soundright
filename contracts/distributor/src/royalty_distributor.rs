use odra::prelude::*;
use odra::casper_types::U512;

// ──────────────────────────── Events ───────────────────────────────────────

#[odra::event]
pub struct RoyaltiesDistributed {
    pub new_play_count: u64,
    pub total_royalty: U512,
    pub distribution_index: u32,
}

#[odra::event]
pub struct RoyaltiesClaimed {
    pub holder: Address,
    pub amount: U512,
}

// ──────────────────────────── Contract ─────────────────────────────────────

/// RoyaltyDistributor — distributes royalties to token holders based on play counts.
///
/// Key features:
/// - Only the authorized oracle contract can trigger distribution.
/// - Uses a pull pattern: holders must manually claim their royalties.
/// - Tracks total distributed amount, claim history, and pending royalties per holder.
/// - Royalties are denominated in CSPR (U512 for u128-level precision).
#[odra::module]
pub struct RoyaltyDistributor {
    token_contract: Var<Address>,
    oracle_contract: Var<Address>,
    admin: Var<Address>,
    total_distributed: Var<U512>,
    last_play_count: Var<u64>,
    distribution_count: Var<u32>,
    holder_claimed: Mapping<Address, U512>,
    pending_royalties: Mapping<Address, U512>,
    // Track known holders for distribution
    known_holders: Mapping<Address, bool>,
    holder_list: Mapping<u32, Address>,
    holder_count: Var<u32>,
}

#[odra::module]
impl RoyaltyDistributor {
    /// Deploy: sets admin, token contract, and oracle contract addresses.
    pub fn init(&mut self, token_contract: Address, oracle_contract: Address) {
        let caller = self.env().caller();
        self.admin.set(caller);
        self.token_contract.set(token_contract);
        self.oracle_contract.set(oracle_contract);
        self.holder_count.set(0u32);
    }

    /// Distribute royalties to holders. Only callable by the oracle contract.
    ///
    /// - `new_play_count`: cumulative play count after this period
    /// - `holders`: list of token holder addresses
    /// - `amounts`: corresponding royalty amounts (CSPR, as motes)
    pub fn distribute_royalties(
        &mut self,
        new_play_count: u64,
        holders: Vec<Address>,
        amounts: Vec<U512>,
    ) {
        let caller = self.env().caller();
        let oracle = self.oracle_contract.get().unwrap();
        if caller != oracle {
            self.env().revert(DistributorError::Unauthorized);
        }

        let prev_play_count = self.last_play_count.get_or_default();
        if new_play_count <= prev_play_count {
            self.env().revert(DistributorError::InvalidPlayCount);
        }

        self.last_play_count.set(new_play_count);

        let mut total_royalty = U512::zero();
        for (i, holder) in holders.iter().enumerate() {
            let amount = amounts[i];
            let current_pending = self.pending_royalties.get_or_default(holder);
            self.pending_royalties.set(holder, current_pending + amount);
            total_royalty += amount;

            // Register holder if new
            if !self.known_holders.get_or_default(holder) {
                let idx = self.holder_count.get_or_default();
                self.known_holders.set(holder, true);
                self.holder_list.set(&idx, *holder);
                self.holder_count.set(idx + 1);
            }
        }

        let prev_total = self.total_distributed.get_or_default();
        self.total_distributed.set(prev_total + total_royalty);
        let prev_count = self.distribution_count.get_or_default();
        self.distribution_count.set(prev_count + 1);

        self.env().emit_event(RoyaltiesDistributed {
            new_play_count,
            total_royalty,
            distribution_index: prev_count + 1,
        });
    }

    /// Claim pending royalties. Pull pattern — records the claim on-chain.
    /// The actual CSPR transfer is handled by the backend (x402 payment layer).
    pub fn claim_royalties(&mut self) {
        let caller = self.env().caller();
        let pending = self.pending_royalties.get_or_default(&caller);

        if pending.is_zero() {
            self.env().revert(DistributorError::NoPendingRoyalties);
        }

        self.pending_royalties.set(&caller, U512::zero());
        let prev_claimed = self.holder_claimed.get_or_default(&caller);
        self.holder_claimed.set(&caller, prev_claimed + pending);

        self.env().emit_event(RoyaltiesClaimed {
            holder: caller,
            amount: pending,
        });
    }

    /// Register a holder (admin only, for initial setup).
    pub fn register_holder(&mut self, holder: Address) {
        self._only_admin();
        if !self.known_holders.get_or_default(&holder) {
            let idx = self.holder_count.get_or_default();
            self.known_holders.set(&holder, true);
            self.holder_list.set(&idx, holder);
            self.holder_count.set(idx + 1);
        }
    }

    pub fn admin(&self) -> Address {
        self.admin.get().unwrap()
    }

    // ──────────────────────────── View functions ────────────────────────────

    pub fn get_pending(&self, holder: Address) -> U512 {
        self.pending_royalties.get_or_default(&holder)
    }

    pub fn get_total_claimed(&self, holder: Address) -> U512 {
        self.holder_claimed.get_or_default(&holder)
    }

    pub fn get_total_distributed(&self) -> U512 {
        self.total_distributed.get_or_default()
    }

    pub fn get_distribution_count(&self) -> u32 {
        self.distribution_count.get_or_default()
    }

    pub fn get_holder_count(&self) -> u32 {
        self.holder_count.get_or_default()
    }

    pub fn token_contract(&self) -> Address {
        self.token_contract.get().unwrap()
    }

    pub fn oracle_contract(&self) -> Address {
        self.oracle_contract.get().unwrap()
    }

    // ──────────────────────────── Internal ──────────────────────────────────

    fn _only_admin(&self) {
        let caller = self.env().caller();
        let admin = self.admin.get().unwrap();
        if caller != admin {
            self.env().revert(DistributorError::Unauthorized);
        }
    }
}

// ──────────────────────────── Errors ──────────────────────────────────────

#[odra::odra_error]
pub enum DistributorError {
    Unauthorized = 1,
    NoPendingRoyalties = 2,
    TransferFailed = 3,
    InvalidPlayCount = 4,
}

// ──────────────────────────── Tests ───────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::Deployer;

    // ── Helper ──────────────────────────────────────────────────────────────

    fn deploy_distributor() -> (odra::host::HostEnv, RoyaltyDistributorHostRef) {
        let env = odra_test::env();
        // Use fake addresses for token and oracle contracts
        let token_addr = env.get_account(5);
        let oracle_addr = env.get_account(6);
        let distributor = RoyaltyDistributor::deploy(
            &env,
            RoyaltyDistributorInitArgs {
                token_contract: token_addr,
                oracle_contract: oracle_addr,
            },
        );
        (env, distributor)
    }

    fn mock_holders(env: &odra::host::HostEnv) -> (Address, Address, Address) {
        (env.get_account(1), env.get_account(2), env.get_account(3))
    }

    // ── Init tests ──────────────────────────────────────────────────────────

    #[test]
    fn test_init_sets_contracts() {
        let (env, distributor) = deploy_distributor();

        assert_eq!(distributor.admin(), env.get_account(0));
        assert_eq!(distributor.token_contract(), env.get_account(5));
        assert_eq!(distributor.oracle_contract(), env.get_account(6));
        assert_eq!(distributor.get_distribution_count(), 0);
        assert_eq!(distributor.get_holder_count(), 0);
    }

    // ── Distribute tests ────────────────────────────────────────────────────

    #[test]
    fn test_distribute_royalties() {
        let (env, mut distributor) = deploy_distributor();
        let oracle_addr = env.get_account(6);
        let (alice, bob, carol) = mock_holders(&env);

        env.set_caller(oracle_addr);
        distributor.distribute_royalties(
            1000,
            vec![alice, bob, carol],
            vec![
                U512::from(3000u64),
                U512::from(2000u64),
                U512::from(1000u64),
            ],
        );

        assert_eq!(distributor.get_pending(alice), U512::from(3000u64));
        assert_eq!(distributor.get_pending(bob), U512::from(2000u64));
        assert_eq!(distributor.get_pending(carol), U512::from(1000u64));
        assert_eq!(distributor.get_total_distributed(), U512::from(6000u64));
        assert_eq!(distributor.get_distribution_count(), 1);
        assert_eq!(distributor.get_holder_count(), 3);
    }

    #[test]
    fn test_multiple_distributions_accumulate() {
        let (env, mut distributor) = deploy_distributor();
        let oracle_addr = env.get_account(6);
        let alice = env.get_account(1);

        env.set_caller(oracle_addr);
        distributor.distribute_royalties(500, vec![alice], vec![U512::from(1000u64)]);
        distributor.distribute_royalties(1500, vec![alice], vec![U512::from(2000u64)]);

        assert_eq!(distributor.get_pending(alice), U512::from(3000u64));
        assert_eq!(distributor.get_total_distributed(), U512::from(3000u64));
        assert_eq!(distributor.get_distribution_count(), 2);
    }

    #[test]
    fn test_unauthorized_distribute_reverts() {
        let (env, mut distributor) = deploy_distributor();
        let alice = env.get_account(1);

        env.set_caller(alice);
        let result = distributor.try_distribute_royalties(
            100,
            vec![alice],
            vec![U512::from(100u64)],
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_play_count_reverts() {
        let (env, mut distributor) = deploy_distributor();
        let oracle_addr = env.get_account(6);

        // First distribution sets play count to 500
        env.set_caller(oracle_addr);
        distributor.distribute_royalties(
            500,
            vec![env.get_account(1)],
            vec![U512::from(100u64)],
        );

        // Second distribution with lower play count should revert
        let result = distributor.try_distribute_royalties(
            300,
            vec![env.get_account(1)],
            vec![U512::from(100u64)],
        );
        assert!(result.is_err());
    }

    // ── Claim tests ─────────────────────────────────────────────────────────

    #[test]
    fn test_claim_royalties() {
        let (env, mut distributor) = deploy_distributor();
        let oracle_addr = env.get_account(6);
        let alice = env.get_account(1);

        // Distribute
        env.set_caller(oracle_addr);
        distributor.distribute_royalties(
            1000,
            vec![alice],
            vec![U512::from(5000u64)],
        );

        // Claim
        env.set_caller(alice);
        distributor.claim_royalties();

        assert_eq!(distributor.get_pending(alice), U512::zero());
        assert_eq!(distributor.get_total_claimed(alice), U512::from(5000u64));
    }

    #[test]
    fn test_claim_empty_reverts() {
        let (env, mut distributor) = deploy_distributor();
        let alice = env.get_account(1);

        env.set_caller(alice);
        let result = distributor.try_claim_royalties();
        assert!(result.is_err());
    }

    #[test]
    fn test_claim_does_not_double_pay() {
        let (env, mut distributor) = deploy_distributor();
        let oracle_addr = env.get_account(6);
        let alice = env.get_account(1);

        env.set_caller(oracle_addr);
        distributor.distribute_royalties(
            1000,
            vec![alice],
            vec![U512::from(2000u64)],
        );

        env.set_caller(alice);
        distributor.claim_royalties();

        // Second claim should revert (no pending)
        let result = distributor.try_claim_royalties();
        assert!(result.is_err());
    }

    // ── Admin tests ─────────────────────────────────────────────────────────

    #[test]
    fn test_register_holder() {
        let (env, mut distributor) = deploy_distributor();
        let alice = env.get_account(1);

        distributor.register_holder(alice);
        assert_eq!(distributor.get_holder_count(), 1);
    }

    #[test]
    fn test_non_admin_cannot_register_holder() {
        let (env, mut distributor) = deploy_distributor();
        let alice = env.get_account(1);

        env.set_caller(alice);
        let result = distributor.try_register_holder(env.get_account(2));
        assert!(result.is_err());
    }

    #[test]
    fn test_distribute_registers_holders_automatically() {
        let (env, mut distributor) = deploy_distributor();
        let oracle_addr = env.get_account(6);
        let (alice, bob, _) = mock_holders(&env);

        assert_eq!(distributor.get_holder_count(), 0);

        env.set_caller(oracle_addr);
        distributor.distribute_royalties(
            1000,
            vec![alice, bob],
            vec![U512::from(1000u64), U512::from(500u64)],
        );

        assert_eq!(distributor.get_holder_count(), 2);
    }
}
