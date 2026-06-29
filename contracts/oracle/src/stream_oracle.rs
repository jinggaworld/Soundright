use odra::prelude::*;

// ──────────────────────────── Events ───────────────────────────────────────

#[odra::event]
pub struct PlayCountReported {
    pub spotify_track_id: String,
    pub play_count: u64,
    pub ai_report_hash: String,
    pub reporter: Address,
    pub timestamp: u64,
}

#[odra::event]
pub struct ReporterAdded {
    pub reporter: Address,
}

#[odra::event]
pub struct ReporterRemoved {
    pub reporter: Address,
}

// ──────────────────────────── Contract ─────────────────────────────────────

/// StreamOracle — stores verified play count data on-chain.
///
/// Key features:
/// - Only authorized reporters can submit play counts.
/// - Admin manages reporter authorization.
/// - Each report stores the play count, timestamp, and AI report hash (SHA-256).
/// - Tracks update count per track for auditability.
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
    /// Deploy: sets caller as admin and auto-authorizes them as a reporter.
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.admin.set(caller);
        self.authorized_reporters.set(&caller, true);
    }

    /// Submit a verified play count for a track. Only authorized reporters.
    pub fn report_play_count(
        &mut self,
        spotify_track_id: String,
        play_count: u64,
        ai_report_hash: String,
    ) {
        let caller = self.env().caller();
        if !self.authorized_reporters.get_or_default(&caller) {
            self.env().revert(OracleError::Unauthorized);
        }

        self.play_counts.set(&spotify_track_id, play_count);
        self.last_updated.set(&spotify_track_id, self.env().get_block_time());
        self.ai_report_hashes.set(&spotify_track_id, ai_report_hash.clone());

        let prev = self.update_count.get_or_default(&spotify_track_id);
        self.update_count.set(&spotify_track_id, prev + 1);

        self.env().emit_event(PlayCountReported {
            spotify_track_id: spotify_track_id.clone(),
            play_count,
            ai_report_hash,
            reporter: caller,
            timestamp: self.env().get_block_time(),
        });
    }

    // ──────────────────────────── View functions ────────────────────────────

    pub fn get_play_count(&self, spotify_track_id: String) -> u64 {
        self.play_counts.get_or_default(&spotify_track_id)
    }

    pub fn get_last_updated(&self, spotify_track_id: String) -> u64 {
        self.last_updated.get_or_default(&spotify_track_id)
    }

    pub fn get_ai_report_hash(&self, spotify_track_id: String) -> String {
        self.ai_report_hashes.get_or_default(&spotify_track_id)
    }

    pub fn get_update_count(&self, spotify_track_id: String) -> u32 {
        self.update_count.get_or_default(&spotify_track_id)
    }

    pub fn admin(&self) -> Address {
        self.admin
            .get()
            .unwrap_or_else(|| self.env().revert(OracleError::Unauthorized))
    }

    pub fn is_authorized(&self, reporter: Address) -> bool {
        self.authorized_reporters.get_or_default(&reporter)
    }

    // ──────────────────────────── Admin ─────────────────────────────────────

    pub fn add_reporter(&mut self, reporter: Address) {
        self._only_admin();
        self.authorized_reporters.set(&reporter, true);
        self.env().emit_event(ReporterAdded { reporter });
    }

    pub fn remove_reporter(&mut self, reporter: Address) {
        self._only_admin();
        self.authorized_reporters.set(&reporter, false);
        self.env().emit_event(ReporterRemoved { reporter });
    }

    // ──────────────────────────── Internal ──────────────────────────────────

    fn _only_admin(&self) {
        let caller = self.env().caller();
        let admin = self
            .admin
            .get()
            .unwrap_or_else(|| self.env().revert(OracleError::Unauthorized));
        if caller != admin {
            self.env().revert(OracleError::Unauthorized);
        }
    }
}

// ──────────────────────────── Errors ──────────────────────────────────────

#[odra::odra_error]
pub enum OracleError {
    Unauthorized = 1,
    InvalidData = 2,
}

// ──────────────────────────── Tests ───────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::Deployer;

    // ── Helper ──────────────────────────────────────────────────────────────

    fn deploy_oracle() -> (odra::host::HostEnv, StreamOracleHostRef) {
        let env = odra_test::env();
        let oracle = StreamOracle::deploy(&env, odra::host::NoArgs);
        (env, oracle)
    }

    // ── Init tests ──────────────────────────────────────────────────────────

    #[test]
    fn test_init_sets_admin_and_authorizes_caller() {
        let (env, oracle) = deploy_oracle();
        let admin = env.get_account(0);

        assert_eq!(oracle.admin(), admin);
        assert!(oracle.is_authorized(admin));
    }

    // ── Report tests ────────────────────────────────────────────────────────

    #[test]
    fn test_report_play_count() {
        let (env, mut oracle) = deploy_oracle();
        let track_id = "4Z8W4fKeB5YxbusRsdQVPb".to_string();
        let report_hash = "sha256:abc123".to_string();

        oracle.report_play_count(track_id.clone(), 1500, report_hash.clone());

        assert_eq!(oracle.get_play_count(track_id.clone()), 1500);
        assert_eq!(oracle.get_ai_report_hash(track_id.clone()), report_hash);
        assert_eq!(oracle.get_update_count(track_id), 1);
    }

    #[test]
    fn test_report_overwrites_previous() {
        let (env, mut oracle) = deploy_oracle();
        let track_id = "4Z8W4fKeB5YxbusRsdQVPb".to_string();

        oracle.report_play_count(track_id.clone(), 1000, "hash1".to_string());
        oracle.report_play_count(track_id.clone(), 2500, "hash2".to_string());

        assert_eq!(oracle.get_play_count(track_id.clone()), 2500);
        assert_eq!(oracle.get_ai_report_hash(track_id), "hash2".to_string());
    }

    #[test]
    fn test_update_count_increments() {
        let (env, mut oracle) = deploy_oracle();
        let track_id = "4Z8W4fKeB5YxbusRsdQVPb".to_string();

        assert_eq!(oracle.get_update_count(track_id.clone()), 0);

        oracle.report_play_count(track_id.clone(), 100, "h1".to_string());
        assert_eq!(oracle.get_update_count(track_id.clone()), 1);

        oracle.report_play_count(track_id.clone(), 200, "h2".to_string());
        assert_eq!(oracle.get_update_count(track_id), 2);
    }

    #[test]
    fn test_unauthorized_reporter_reverts() {
        let (env, mut oracle) = deploy_oracle();
        let alice = env.get_account(1);

        env.set_caller(alice);
        let result = oracle.try_report_play_count(
            "track1".to_string(),
            100,
            "hash".to_string(),
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_authorized_reporter_can_report() {
        let (env, mut oracle) = deploy_oracle();
        let alice = env.get_account(1);

        oracle.add_reporter(alice);

        env.set_caller(alice);
        oracle.report_play_count("track1".to_string(), 500, "hash1".to_string());
        assert_eq!(oracle.get_play_count("track1".to_string()), 500);
    }

    // ── Admin tests ─────────────────────────────────────────────────────────

    #[test]
    fn test_add_and_remove_reporter() {
        let (env, mut oracle) = deploy_oracle();
        let alice = env.get_account(1);

        oracle.add_reporter(alice);
        assert!(oracle.is_authorized(alice));

        oracle.remove_reporter(alice);
        assert!(!oracle.is_authorized(alice));
    }

    #[test]
    fn test_non_admin_cannot_add_reporter() {
        let (env, mut oracle) = deploy_oracle();
        let alice = env.get_account(1);
        let bob = env.get_account(2);

        env.set_caller(alice);
        let result = oracle.try_add_reporter(bob);
        assert!(result.is_err());
    }

    #[test]
    fn test_non_admin_cannot_remove_reporter() {
        let (env, mut oracle) = deploy_oracle();
        let alice = env.get_account(1);
        let admin = env.get_account(0);

        // Remove admin as reporter first
        oracle.remove_reporter(admin);

        env.set_caller(alice);
        let result = oracle.try_remove_reporter(admin);
        assert!(result.is_err());
    }

    #[test]
    fn test_removed_reporter_cannot_report() {
        let (env, mut oracle) = deploy_oracle();
        let alice = env.get_account(1);

        oracle.add_reporter(alice);
        oracle.remove_reporter(alice);

        env.set_caller(alice);
        let result = oracle.try_report_play_count(
            "track1".to_string(),
            100,
            "hash".to_string(),
        );
        assert!(result.is_err());
    }
}
