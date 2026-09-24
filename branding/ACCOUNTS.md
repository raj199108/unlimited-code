# Accounts and software access

An active $99 USD/month software subscription and verified account sign-in are required for all workspace use. Downloads, sign-up, sign-in, profile management, subscription management, logout, and help/version remain available before purchase. Sign-up alone never unlocks the app.

Paid users retain upstream provider connections, custom endpoints, local models, agents, workflows and tools. Model charges are paid directly to their providers. There is no company-funded inference gateway, company OpenRouter key, restricted managed model catalogue, or special OpenRouter-only vault.

The private platform verifies Supabase identity and reads the current paid period under the user's RLS context. Only a server-verified payment can grant a software entitlement. A separate migration distinguishes legacy managed-model subscriptions from software subscriptions. Cancellation preserves already-paid time; expiry, payment holds, full refunds and unresolved disputes deny access. Users cannot write subscriptions or billing events.

The desktop and CLI keep Auth tokens in OS-backed secure storage. A random-secret loopback endpoint conveys only a short-lived access result to the engine, never profile tokens, provider credentials or model payloads. The engine denies missing authority configuration, credential writes, HTTP workspace requests, model turns and tool calls without access. The CLI checks before launch and while running. The desktop polls account state, closes the workspace and stops its sidecar on loss of access, and starts a fresh sidecar after renewal. Checks use at most five seconds of local access caching; network timeouts and process teardown add bounded detection time. Offline use is unavailable. This controls official application paths; publicly available source can be modified and is not tamper-proof DRM.

Third-party provider names such as OpenCode Zen and OpenCode Go identify their actual services. Technical SDK/config compatibility identifiers and upstream licences remain intact. See the [implementation checklist](../IMPLEMENTATION_CHECKLIST.md) for verification and launch work.
