export function engineEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  return { ...environment, OPENCODE_DISABLE_AUTOUPDATE: "1", OPENCODE_DISABLE_SHARE: "1" }
}
