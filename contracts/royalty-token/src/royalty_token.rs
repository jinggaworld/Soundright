use odra::prelude::*;
use odra::casper_types::U256;

// ──────────────────────────── Events ───────────────────────────────────────

#[odra::event]
pub struct Transfer {
    pub from: Address,
    pub to: Address,
    pub amount: U256,
}

#[odra::event]
pub struct Approval {
    pub owner: Address,
    pub spender: Address,
    pub amount: U256,
}

// ──────────────────────────── Contract ─────────────────────────────────────

/// RoyaltyToken — an ERC-20 style token representing a percentage of song royalties.
///
/// Key features:
/// - Minted to the artist on tokenisation; total_supply is the number of "shares".
/// - Transfers are **locked by default** until the artist unlocks them or KYC-verifies the sender.
/// - Only the deploying artist can verify KYC, toggle the transfer lock, or set the compliance hash.
/// - A royalty_rate_per_mille (parts per thousand) is stored for downstream royalty calculations.
#[odra::module]
pub struct RoyaltyToken {
    // ── ERC-20 metadata ──
    name: Var<String>,
    symbol: Var<String>,
    decimals: Var<u8>,
    total_supply: Var<U256>,

    // ── Song info ──
    song_title: Var<String>,
    spotify_track_id: Var<String>,
    isrc_code: Var<String>,
    artist_address: Var<Address>,

    // ── Royalty config ──
    royalty_rate_per_mille: Var<U256>,
    distribution_interval: Var<u64>,
    last_distribution: Var<u64>,

    // ── Compliance ──
    compliance_hash: Var<String>,
    is_verified: Var<bool>,

    // ── ERC-20 state ──
    balances: Mapping<Address, U256>,
    // Odra 2.x Mapping does not support nested mappings, so we flatten the key.
    allowances: Mapping<String, U256>,

    // ── KYC / transfer lock ──
    kyc_verified: Mapping<Address, bool>,
    transfers_locked: Var<bool>,
}

#[odra::module]
impl RoyaltyToken {
    // ──────────────────────────── Initialisation ────────────────────────────

    /// Deploy & mint the entire supply to the caller (artist).
    pub fn init(
        &mut self,
        name: String,
        symbol: String,
        total_supply: U256,
        song_title: String,
        spotify_track_id: String,
        isrc_code: String,
        royalty_rate_per_mille: U256,
        compliance_hash: String,
    ) {
        let caller = self.env().caller();

        self.name.set(name);
        self.symbol.set(symbol);
        self.decimals.set(18u8);
        self.total_supply.set(total_supply);

        self.song_title.set(song_title);
        self.spotify_track_id.set(spotify_track_id);
        self.isrc_code.set(isrc_code);
        self.artist_address.set(caller);

        self.royalty_rate_per_mille.set(royalty_rate_per_mille);
        self.distribution_interval.set(604_800u64); // 7 days
        self.last_distribution.set(0u64);

        self.compliance_hash.set(compliance_hash);
        self.is_verified.set(false);
        self.transfers_locked.set(true);

        // Mint everything to the artist
        self.balances.set(&caller, total_supply);
    }

    // ──────────────────────────── ERC-20 interface ──────────────────────────

    pub fn transfer(&mut self, to: Address, amount: U256) {
        let caller = self.env().caller();
        self._enforce_lock(&caller);
        self._do_transfer(caller, to, amount);
    }

    pub fn approve(&mut self, spender: Address, amount: U256) {
        let caller = self.env().caller();
        let key = Self::allowance_key(&caller, &spender);
        self.allowances.set(&key, amount);
        self.env().emit_event(Approval {
            owner: caller,
            spender,
            amount,
        });
    }

    pub fn transfer_from(&mut self, from: Address, to: Address, amount: U256) {
        let caller = self.env().caller();
        self._enforce_lock(&caller);

        let key = Self::allowance_key(&from, &caller);
        let allowance = self.allowances.get_or_default(&key);
        if allowance < amount {
            self.env().revert(RoyaltyTokenError::InsufficientAllowance);
        }
        self.allowances.set(&key, allowance - amount);

        self._do_transfer(from, to, amount);
    }

    pub fn balance_of(&self, owner: Address) -> U256 {
        self.balances.get_or_default(&owner)
    }

    pub fn total_supply(&self) -> U256 {
        self.total_supply.get_or_default()
    }

    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        let key = Self::allowance_key(&owner, &spender);
        self.allowances.get_or_default(&key)
    }

    pub fn name(&self) -> String {
        self.name.get_or_default()
    }

    pub fn symbol(&self) -> String {
        self.symbol.get_or_default()
    }

    // ──────────────────────────── Song / royalty view fns ───────────────────

    pub fn song_title(&self) -> String {
        self.song_title.get_or_default()
    }

    pub fn spotify_track_id(&self) -> String {
        self.spotify_track_id.get_or_default()
    }

    pub fn isrc_code(&self) -> String {
        self.isrc_code.get_or_default()
    }

    pub fn artist_address(&self) -> Address {
        self.artist_address
            .get()
            .unwrap_or_else(|| self.env().revert(RoyaltyTokenError::Unauthorized))
    }

    pub fn royalty_rate_per_mille(&self) -> U256 {
        self.royalty_rate_per_mille.get_or_default()
    }

    pub fn is_verified(&self) -> bool {
        self.is_verified.get_or_default()
    }

    pub fn compliance_hash(&self) -> String {
        self.compliance_hash.get_or_default()
    }

    pub fn transfers_locked(&self) -> bool {
        self.transfers_locked.get_or_default()
    }

    // ──────────────────────────── Artist admin ──────────────────────────────

    /// Mark the token as compliance-verified (artist only).
    pub fn set_verified(&mut self, compliance_hash: String) {
        self._only_artist();
        self.is_verified.set(true);
        self.compliance_hash.set(compliance_hash);
    }

    /// KYC-verify an address so it can transfer even when locked (artist only).
    pub fn set_kyc_verified(&mut self, address: Address) {
        self._only_artist();
        self.kyc_verified.set(&address, true);
    }

    /// Lock or unlock transfers globally (artist only).
    pub fn set_transfers_locked(&mut self, locked: bool) {
        self._only_artist();
        self.transfers_locked.set(locked);
    }

    /// Update the royalty rate (artist only).
    pub fn set_royalty_rate(&mut self, rate_per_mille: U256) {
        self._only_artist();
        self.royalty_rate_per_mille.set(rate_per_mille);
    }

    // ──────────────────────────── Internal ──────────────────────────────────

    /// Core transfer: check balance, move tokens, emit event.
    fn _do_transfer(&mut self, from: Address, to: Address, amount: U256) {
        let from_balance = self.balances.get_or_default(&from);
        if from_balance < amount {
            self.env().revert(RoyaltyTokenError::InsufficientBalance);
        }
        self.balances.set(&from, from_balance - amount);
        let to_balance = self.balances.get_or_default(&to);
        self.balances.set(&to, to_balance + amount);
        self.env().emit_event(Transfer { from, to, amount });
    }

    /// Revert if transfers are locked and the caller is not KYC-verified.
    fn _enforce_lock(&self, caller: &Address) {
        if self.transfers_locked.get_or_default() && !self.kyc_verified.get_or_default(caller) {
            self.env().revert(RoyaltyTokenError::NotKycVerified);
        }
    }

    fn _only_artist(&self) {
        let caller = self.env().caller();
        let artist = self
            .artist_address
            .get()
            .unwrap_or_else(|| self.env().revert(RoyaltyTokenError::Unauthorized));
        if caller != artist {
            self.env().revert(RoyaltyTokenError::Unauthorized);
        }
    }

    /// Build a composite key for the flat allowances mapping.
    fn allowance_key(owner: &Address, spender: &Address) -> String {
        format!("{}:{}", owner.to_string(), spender.to_string())
    }
}

// ──────────────────────────── Errors ──────────────────────────────────────

#[odra::odra_error]
pub enum RoyaltyTokenError {
    InsufficientBalance = 1,
    NotKycVerified = 2,
    Unauthorized = 3,
    InsufficientAllowance = 4,
}

// ──────────────────────────── Tests ───────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use odra::casper_types::U256;
    use odra::host::Deployer;

    // ── Constants ───────────────────────────────────────────────────────────

    const TOKEN_NAME: &str = "Midnight Drive Token";
    const TOKEN_SYMBOL: &str = "MDT";
    const TOTAL_SUPPLY: u64 = 10_000;
    const SONG_TITLE: &str = "Midnight Drive";
    const SPOTIFY_ID: &str = "4Z8W4fKeB5YxbusRsdQVPb";
    const ISRC: &str = "USRC12345678";
    const ROYALTY_RATE: u64 = 4;
    const COMPLIANCE: &str = "ipfs://QmHash123";

    // ── Helper ──────────────────────────────────────────────────────────────

    fn deploy_token() -> (odra::host::HostEnv, RoyaltyTokenHostRef) {
        let env = odra_test::env();
        let token = RoyaltyToken::deploy(
            &env,
            RoyaltyTokenInitArgs {
                name: TOKEN_NAME.to_string(),
                symbol: TOKEN_SYMBOL.to_string(),
                total_supply: U256::from(TOTAL_SUPPLY),
                song_title: SONG_TITLE.to_string(),
                spotify_track_id: SPOTIFY_ID.to_string(),
                isrc_code: ISRC.to_string(),
                royalty_rate_per_mille: U256::from(ROYALTY_RATE),
                compliance_hash: COMPLIANCE.to_string(),
            },
        );
        (env, token)
    }

    // ── Init tests ──────────────────────────────────────────────────────────

    #[test]
    fn test_init_sets_metadata() {
        let (_env, token) = deploy_token();

        assert_eq!(token.total_supply(), U256::from(TOTAL_SUPPLY));
        assert_eq!(token.name(), TOKEN_NAME);
        assert_eq!(token.symbol(), TOKEN_SYMBOL);
        assert_eq!(token.song_title(), SONG_TITLE);
        assert_eq!(token.spotify_track_id(), SPOTIFY_ID);
        assert_eq!(token.isrc_code(), ISRC);
        assert_eq!(token.royalty_rate_per_mille(), U256::from(ROYALTY_RATE));
        assert_eq!(token.compliance_hash(), COMPLIANCE);
        assert!(!token.is_verified());
        assert!(token.transfers_locked());
    }

    #[test]
    fn test_init_mints_to_artist() {
        let (env, token) = deploy_token();
        let artist = env.get_account(0);

        assert_eq!(token.balance_of(artist), U256::from(TOTAL_SUPPLY));
    }

    // ── Transfer tests ──────────────────────────────────────────────────────

    #[test]
    fn test_transfer_when_unlocked() {
        let (env, mut token) = deploy_token();
        let artist = env.get_account(0);
        let bob = env.get_account(2);

        token.set_transfers_locked(false);
        token.transfer(bob, U256::from(500));

        assert_eq!(token.balance_of(bob), U256::from(500));
        assert_eq!(token.balance_of(artist), U256::from(TOTAL_SUPPLY - 500));
    }

    #[test]
    fn test_transfer_blocked_when_locked_and_not_kycd() {
        let (env, mut token) = deploy_token();
        let alice = env.get_account(1);
        let bob = env.get_account(2);

        // Give alice tokens first
        token.set_transfers_locked(false);
        token.transfer(alice, U256::from(1000));
        token.set_transfers_locked(true);

        // alice is not KYC'd — should revert
        env.set_caller(alice);
        let result = token.try_transfer(bob, U256::from(100));
        assert!(result.is_err());
    }

    #[test]
    fn test_transfer_with_kyc_when_locked() {
        let (env, mut token) = deploy_token();
        let alice = env.get_account(1);
        let bob = env.get_account(2);

        // KYC alice, give tokens, re-lock
        token.set_kyc_verified(alice);
        token.set_transfers_locked(false);
        token.transfer(alice, U256::from(1000));
        token.set_transfers_locked(true);

        // Alice can transfer (KYC-verified)
        env.set_caller(alice);
        token.transfer(bob, U256::from(200));

        assert_eq!(token.balance_of(alice), U256::from(800));
        assert_eq!(token.balance_of(bob), U256::from(200));
    }

    #[test]
    fn test_transfer_insufficient_balance() {
        let (env, mut token) = deploy_token();
        let bob = env.get_account(2);

        token.set_transfers_locked(false);
        let result = token.try_transfer(bob, U256::from(TOTAL_SUPPLY + 1));
        assert!(result.is_err());
    }

    // ── Allowance / transferFrom tests ──────────────────────────────────────

    #[test]
    fn test_approve_and_transfer_from() {
        let (env, mut token) = deploy_token();
        let artist = env.get_account(0);
        let alice = env.get_account(1);
        let bob = env.get_account(2);

        token.set_transfers_locked(false);

        // Artist approves alice to spend 500
        token.approve(alice, U256::from(500));
        assert_eq!(token.allowance(artist, alice), U256::from(500));

        // Alice transfersFrom artist -> bob
        env.set_caller(alice);
        token.transfer_from(artist, bob, U256::from(300));

        assert_eq!(token.balance_of(bob), U256::from(300));
        assert_eq!(token.allowance(artist, alice), U256::from(200));
        assert_eq!(token.balance_of(artist), U256::from(TOTAL_SUPPLY - 300));
    }

    #[test]
    fn test_transfer_from_exceeds_allowance() {
        let (env, mut token) = deploy_token();
        let alice = env.get_account(1);
        let bob = env.get_account(2);

        token.set_transfers_locked(false);
        token.approve(alice, U256::from(100));

        env.set_caller(alice);
        let result =
            token.try_transfer_from(env.get_account(0), bob, U256::from(200));
        assert!(result.is_err());
    }

    #[test]
    fn test_transfer_from_blocked_when_locked() {
        let (env, mut token) = deploy_token();
        let alice = env.get_account(1);
        let bob = env.get_account(2);

        // Approve alice while locked (default)
        token.approve(alice, U256::from(500));

        // transfer_from blocked by lock
        env.set_caller(alice);
        let result =
            token.try_transfer_from(env.get_account(0), bob, U256::from(100));
        assert!(result.is_err());
    }

    // ── Admin tests ─────────────────────────────────────────────────────────

    #[test]
    fn test_set_verified() {
        let (_env, mut token) = deploy_token();
        let new_hash = "ipfs://QmNewHash";

        token.set_verified(new_hash.to_string());

        assert!(token.is_verified());
        assert_eq!(token.compliance_hash(), new_hash);
    }

    #[test]
    fn test_set_kyc_verified() {
        let (env, mut token) = deploy_token();
        let alice = env.get_account(1);
        let bob = env.get_account(2);

        token.set_kyc_verified(alice);

        // Give alice tokens
        token.set_transfers_locked(false);
        token.transfer(alice, U256::from(100));
        token.set_transfers_locked(true);

        // Alice can transfer while locked (KYC)
        env.set_caller(alice);
        token.transfer(bob, U256::from(50));

        assert_eq!(token.balance_of(alice), U256::from(50));
        assert_eq!(token.balance_of(bob), U256::from(50));
    }

    #[test]
    fn test_non_artist_cannot_admin() {
        let (env, mut token) = deploy_token();
        let alice = env.get_account(1);

        env.set_caller(alice);
        let result = token.try_set_transfers_locked(false);
        assert!(result.is_err());
    }

    #[test]
    fn test_non_artist_cannot_set_royalty_rate() {
        let (env, mut token) = deploy_token();
        let alice = env.get_account(1);

        env.set_caller(alice);
        let result = token.try_set_royalty_rate(U256::from(99));
        assert!(result.is_err());
    }

    #[test]
    fn test_set_royalty_rate() {
        let (_env, mut token) = deploy_token();

        token.set_royalty_rate(U256::from(8));
        assert_eq!(token.royalty_rate_per_mille(), U256::from(8));
    }
}
