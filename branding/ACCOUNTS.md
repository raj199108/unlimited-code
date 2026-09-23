# Accounts and provider access

The fork retains upstream provider connections and workflows. Account login is optional and has no role in authorizing coding, model requests, tools or custom provider configuration. An account-service outage or logout must not block these operations.

Supabase Auth handles the website, desktop and CLI profile identity. The profile API returns only user ID, verified email and display name. The website edits `profiles.display_name` under the caller's own session and database row-level security. Desktop Settings has separate **Account** and **Providers** sections in both layouts. CLI profile commands are `login`, `logout`, `account` and `account open`; provider connections use `auth login` or `/connect`.

Profile tokens retain PKCE, encrypted OS storage, refresh coordination and logout fencing. Provider credentials use the normal upstream engine storage/configuration, not the profile token vault. The account service neither provisions nor stores model API keys.

The previous managed/BYOK bridge and payment gates have been removed. Private platform migration `202609230005_profile_only.sql` retires client access to old commercial tables/functions and creates profiles without managed model preferences. Historical rows are retained. Retired billing and inference routes return HTTP 410 unconditionally.

Fork identity, themes, signed-download foundations, update isolation and upstream verification remain in place. Upstream automatic or API-driven package replacement is disabled; owned signed release/update delivery remains a release prerequisite.

Third-party service names such as OpenCode Zen and OpenCode Go identify their actual provider and remain unchanged. They are optional upstream provider integrations, not subscriptions sold by Unlimit Code. The branding script explicitly preserves these names alongside technical compatibility identifiers and licensing references.
