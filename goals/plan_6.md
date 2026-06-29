# Plan 6: Smart Contract — StreamOracle & RoyaltyDistributor

## Overview
Implementasi dua smart contract: StreamOracle (menyimpan play count terverifikasi on-chain) dan RoyaltyDistributor (mendistribusikan royalti ke semua token holders).

## Goals
- Implement StreamOracle contract
- Implement RoyaltyDistributor contract
- Unit tests untuk kedua contract
- Build WASM binaries
- Deploy ke Casper testnet

## Tasks

### 6.1 StreamOracle Contract (contracts/oracle/src/lib.rs)
```rust
use odra::prelude::*;

#[odra::module]
pub struct StreamOracle {
    admin: Var<Address>,
    authorized_reporters: Mapping<Address, bool>,
    play_counts: Mapping<String, u64>,
    last_updated: Mapping<String, u64>,
    ai_report_hashes: Mapping<String, String>,
    update_count: Mapping<String, u32>,
}

#[odra::module]
impl StreamOracle {
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.admin.set(caller);
        self.authorized_reporters.set(&caller, true);
    }

    pub fn report_play_count(
        &mut self,
        spotify_track_id: String,
        play_count: u64,
        ai_report_hash: String,
    ) {
        let caller = self.env().caller();
        if !self.authorized_reporters.get(&caller) {
            self.env().revert(OracleError::Unauthorized);
        }

        self.play_counts.set(&spotify_track_id, play_count);
        self.last_updated.set(&spotify_track_id, self.env().block_time());
        self.ai_report_hashes.set(&spotify_track_id, ai_report_hash);
        self.update_count.set(
            &spotify_track_id,
            self.update_count.get(&spotify_track_id) + 1,
        );
    }

    pub fn get_play_count(&self, spotify_track_id: String) -> u64 {
        self.play_counts.get(&spotify_track_id)
    }

    pub fn get_last_updated(&self, spotify_track_id: String) -> u64 {
        self.last_updated.get(&spotify_track_id)
    }

    pub fn get_ai_report_hash(&self, spotify_track_id: String) -> String {
        self.ai_report_hashes.get(&spotify_track_id)
    }

    pub fn add_reporter(&mut self, reporter: Address) {
        let caller = self.env().caller();
        if caller != self.admin.get() {
            self.env().revert(OracleError::Unauthorized);
        }
        self.authorized_reporters.set(&reporter, true);
    }

    pub fn remove_reporter(&mut self, reporter: Address) {
        let caller = self.env().caller();
        if caller != self.admin.get() {
            self.env().revert(OracleError::Unauthorized);
        }
        self.authorized_reporters.set(&reporter, false);
    }
}

#[odra::odra_error]
pub enum OracleError {
    Unauthorized = 1,
    InvalidData = 2,
}
```

### 6.2 RoyaltyDistributor Contract (contracts/distributor/src/lib.rs)
```rust
use odra::prelude::*;
use odra::casper_types::{U512};

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
    holders: Vec<Address>,
    holder_count: Var<u32>,
}

#[odra::module]
impl RoyaltyDistributor {
    pub fn init(&mut self, token_contract: Address, oracle_contract: Address) {
        let caller = self.env().caller();
        self.admin.set(caller);
        self.token_contract.set(token_contract);
        self.oracle_contract.set(oracle_contract);
    }

    pub fn distribute_royalties(
        &mut self,
        new_play_count: u64,
        cspr_per_play: U512,
        holders: Vec<Address>,
        amounts: Vec<U512>,
    ) {
        let caller = self.env().caller();
        if caller != self.oracle_contract.get() {
            self.env().revert(DistributorError::Unauthorized);
        }

        let plays_this_period = new_play_count - self.last_play_count.get();
        let total_royalty = U512::from(plays_this_period) * cspr_per_play;
        self.last_play_count.set(new_play_count);

        for (i, holder) in holders.iter().enumerate() {
            let amount = amounts[i];
            let current_pending = self.pending_royalties.get(holder);
            self.pending_royalties.set(holder, current_pending + amount);
        }

        self.total_distributed.set(self.total_distributed.get() + total_royalty);
        self.distribution_count.set(self.distribution_count.get() + 1);
    }

    pub fn claim_royalties(&mut self) {
        let caller = self.env().caller();
        let pending = self.pending_royalties.get(&caller);

        if pending == U512::zero() {
            self.env().revert(DistributorError::NoPendingRoyalties);
        }

        self.pending_royalties.set(&caller, U512::zero());
        self.holder_claimed.set(&caller, self.holder_claimed.get(&caller) + pending);
        self.env().transfer_tokens(&caller, &pending);
    }

    pub fn get_pending(&self, holder: Address) -> U512 {
        self.pending_royalties.get(&holder)
    }

    pub fn get_total_claimed(&self, holder: Address) -> U512 {
        self.holder_claimed.get(&holder)
    }

    pub fn get_total_distributed(&self) -> U512 {
        self.total_distributed.get()
    }

    pub fn get_distribution_count(&self) -> u32 {
        self.distribution_count.get()
    }
}

#[odra::odra_error]
pub enum DistributorError {
    Unauthorized = 1,
    NoPendingRoyalties = 2,
    TransferFailed = 3,
}
```

### 6.3 Build & Deploy Script
```bash
# Build Oracle
cd contracts/oracle
cargo odra build -b casper-test
cargo odra deploy -b casper --url https://rpc.testnet.casperlabs.io

# Build Distributor
cd ../distributor
cargo odra build -b casper-test
cargo odra deploy -b casper --url https://rpc.testnet.casperlabs.io

# Update .env with contract addresses
```

## Deliverables
- [ ] StreamOracle smart contract
- [ ] RoyaltyDistributor smart contract
- [ ] Unit tests
- [ ] WASM binaries built
- [ ] Deployed to Casper testnet

## Dependencies
- Plan 5 (RoyaltyToken Contract)
- Rust toolchain
- Odra CLI
- Casper testnet account

## Notes
- **Oracle**: Hanya authorized reporters yang bisa submit play counts
- **Distributor**: Hanya oracle contract yang bisa trigger distribusi
- **Claim**: Holders harus manual claim royalties (pull pattern)
- **x402**: Distributor menggunakan x402 untuk batch payments
