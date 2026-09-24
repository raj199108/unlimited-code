export * as ConfigUnlimit from "./unlimit"
import type { ConfigV1 } from "@opencode-ai/core/v1/config/config"

// Preserve provider, model, agent and workflow configuration. Upstream-hosted
// sharing and package updates must not publish data or replace this fork.
export function apply(config: ConfigV1.Info): ConfigV1.Info {
  // Plugin config hooks mutate this shared object; cloning it loses their providers.
  config.autoupdate = false
  config.share = "disabled"
  config.autoshare = false
  return config
}
