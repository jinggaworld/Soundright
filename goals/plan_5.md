# Plan 5: Smart Contract — RoyaltyToken (Odra/Rust)

## Overview
Implementasi smart contract RoyaltyToken menggunakan Odra Framework di Casper Network. Contract ini mengimplementasikan ERC-20 style token yang merepresentasikan % royalti dari sebuah lagu.

## Goals
- Setup Odra development environment
- Implement RoyaltyToken contract
- Unit tests untuk contract
- Build WASM binary
- Deploy ke Casper testnet

## Tasks

### 5.1 Odra Project Setup
```bash
# Install Odra CLI
cargo install odra

# Create contract project
cd contracts
cargo odra new --name royalty-token --module royalty_token
```

### 5.2 RoyaltyToken Contract (contracts/royalty-token/src/lib.rs)
```rust
use odra::prelude::*;
use odra::casper_types::{U256, U512};

#[odra::module]
pub struct RoyaltyToken {
    // Metadata
    name: Var<String>,
    symbol: Var<String>,
    decimals: Var<u8>,
    total_supply: Var<U256>,

    // Song info
    song_title: Var<String>,
    spotify_track_id: Var<String>,
    isrc_code: Var<String>,
    artist_address: Var<Address>,

    // Royalty config
    royalty_rate_per_mille: Var<U256>,
    distribution_interval: Var<u64>,
    last_distribution: Var<u64>,

    // Compliance
    compliance_hash: Var<String>,
    is_verified: Var<bool>,

    // Balances & Allowances
    balances: Mapping<Address, U256>,
    allowances: Mapping<Address, Mapping<Address, U256>>,

    // Transfer lock (KYC)
    kyc_verified: Mapping<Address, bool>,
    transfers_locked: Var<bool>,
}

#[odra::module]
impl RoyaltyToken {
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
        self.distribution_interval.set(604800u64);
        self.compliance_hash.set(compliance_hash);
        self.is_verified.set(false);
        self.transfers_locked.set(true);

        self.balances.set(&caller, total_supply);
    }

    pub fn transfer(&mut self, to: Address, amount: U256) {
        if self.transfers_locked.get() {
            let caller = self.env().caller();
            if !self.kyc_verified.get(&caller) {
                self.env().revert(RoyaltyTokenError::NotKycVerified);
            }
        }
        self._transfer(self.env().caller(), to, amount);
    }

    pub fn approve(&mut self, spender: Address, amount: U256) {
        let caller = self.env().caller();
        self.allowances.get(&caller).set(&spender, amount);
    }

    pub fn transfer_from(&mut self, from: Address, to: Address, amount: U256) {
        let caller = self.env().caller();
        let allowance = self.allowances.get(&from).get(&caller);
        if allowance < amount {
            self.env().revert(RoyaltyTokenError::InsufficientAllowance);
        }
        self.allowances.get(&from).set(&caller, allowance - amount);
        self._transfer(from, to, amount);
    }

    pub fn balance_of(&self, owner: Address) -> U256 {
        self.balances.get(&owner)
    }

    pub fn total_supply(&self) -> U256 {
        self.total_supply.get()
    }

    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.allowances.get(&owner).get(&spender)
    }

    pub fn name(&self) -> String {
        self.name.get()
    }

    pub fn symbol(&self) -> String {
        self.symbol.get()
    }

    pub fn artist_address(&self) -> Address {
        self.artist_address.get()
    }

    pub fn set_verified(&mut self, compliance_hash: String) {
        let caller = self.env().caller();
        // Only oracle or admin can verify
        if caller != self.artist_address.get() {
            self.env().revert(RoyaltyTokenError::Unauthorized);
        }
        self.is_verified.set(true);
        self.compliance_hash.set(compliance_hash);
    }

    pub fn set_kyc_verified(&mut self, address: Address) {
        let caller = self.env().caller();
        if caller != self.artist_address.get() {
            self.env().revert(RoyaltyTokenError::Unauthorized);
        }
        self.kyc_verified.set(&address, true);
    }

    pub fn set_transfers_locked(&mut self, locked: bool) {
        let caller = self.env().caller();
        if caller != self.artist_address.get() {
            self.env().revert(RoyaltyTokenError::Unauthorized);
        }
        self.transfers_locked.set(locked);
    }

    fn _transfer(&mut self, from: Address, to: Address, amount: U256) {
        let from_balance = self.balances.get(&from);
        if from_balance < amount {
            self.env().revert(RoyaltyTokenError::InsufficientBalance);
        }
        self.balances.set(&from, from_balance - amount);
        let to_balance = self.balances.get(&to);
        self.balances.set(&to, to_balance + amount);
    }
}

#[odra::odra_error]
pub enum RoyaltyTokenError {
    InsufficientBalance = 1,
    NotKycVerified = 2,
    Unauthorized = 3,
    InsufficientAllowance = 4,
}
```

### 5.3 Contract Tests (contracts/royalty-token/tests/test.rs)
```rust
#[cfg(test)]
mod tests {
    use odra::casper_types::U256;
    use odra::host::{HostEnv, HostRef};
    use odra_test_env::OdraEnv;

    #[test]
    fn test_init() {
        let mut env = OdraEnv::new();
        let token = env.call_contract("royalty_token", "init", (
            "Midnight Drive Token".to_string(),
            "MDT".to_string(),
            U256::from(1000),
            "Midnight Drive".to_string(),
            "4Z8W4fKeB5YxbusRsdQVPb".to_string(),
            "USRC12345678".to_string(),
            U256::from(4), // $4 per 1000 streams
            "ipfs://hash123".to_string(),
        ));

        assert_eq!(token.total_supply(), U256::from(1000));
        assert_eq!(token.name(), "Midnight Drive Token");
        assert_eq!(token.symbol(), "MDT");
    }

    #[test]
    fn test_transfer() {
        let mut env = OdraEnv::new();
        let alice = env.get_account(1);
        let bob = env.get_account(2);

        // Deploy and setup
        env.call_contract("royalty_token", "init", (...));

        // Enable transfers
        env.call_contract("royalty_token", "set_transfers_locked", (false,));

        // Transfer
        env.call_contract("royalty_token", "transfer", (bob, U256::from(100)));

        assert_eq!(
            env.call_contract("royalty_token", "balance_of", (bob,)),
            U256::from(100)
        );
    }
}
```

### 5.4 Build & Deploy Script
```bash
# Build WASM
cd contracts/royalty-token
cargo odra build -b casper-test

# Deploy to Casper testnet
cargo odra deploy \
  -b casper \
  --url https://rpc.testnet.casperlabs.io \
  --amount 5000000000  # 5 CSPR for deployment

# The deploy output will show the contract address
# Save this to .env as ROYALTY_TOKEN_CONTRACT_ADDRESS
```

## Deliverables
- [ ] RoyaltyToken smart contract (Rust/Odra)
- [ ] ERC-20 compatible interface (transfer, approve, balanceOf)
- [ ] KYC verification system
- [ ] Compliance hash storage
- [ ] Unit tests
- [ ] WASM binary built
- [ ] Deployed to Casper testnet

## Dependencies
- Plan 1 (Project Architecture)
- Rust toolchain installed
- Odra CLI installed
- Casper testnet account with CSPR for deployment

## Notes
- **Odra Framework**: Rust-based smart contract framework untuk Casper Network
- **WASM**: Smart contract dikompilasi ke WebAssembly
- **KYC Lock**: Transfer terkunci sampai artist unlock atauKYC verified
- **Gas**: Deploy contract membutuhkan CSPR untuk gas fees
- **Mainnet**: Deploy langsung ke testnet (bukan testnet) untuk buildathon
