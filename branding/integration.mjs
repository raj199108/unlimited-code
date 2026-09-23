import { execFileSync } from "node:child_process"

export function run(command, args, options = {}) {
  const output = execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options })
  return output?.trim() ?? ""
}

export function candidate(release, previous) {
  if (release.isDraft || release.isPrerelease || !/^v\d+\.\d+\.\d+$/.test(release.tagName))
    throw new Error("Expected an official stable version tag")
  const next = release.tagName.slice(1).split(".").map(BigInt)
  const before = previous.slice(1).split(".").map(BigInt)
  const difference = next.findIndex((value, index) => value !== before[index])
  if (difference === -1) return null
  if (next[difference] < before[difference]) throw new Error("Upstream release would downgrade the baseline")
  return `codex/upstream-${release.tagName}`
}

// Dependency/build scripts run without GitHub/App credentials, artifact tokens or developer model keys.
export function validationEnvironment(env) {
  return Object.fromEntries(
    Object.entries(env).filter(([key]) =>
      /^(PATH|HOME|USER|LOGNAME|SHELL|TMPDIR|TMP|TEMP|LANG|LC_[A-Z_]+|SYSTEMROOT|SystemRoot|COMSPEC|ComSpec|PATHEXT|CI|BUN_INSTALL)$/.test(
        key,
      ),
    ),
  )
}

export function assertAutomationUnchanged(cwd, base = "origin/main", target) {
  const paths = run("git", ["diff", "--name-only", base, ...(target ? [target] : []), "--", ".github"], { cwd })
  if (paths) throw new Error(`Upstream changed automation; manual review required: ${paths}`)
}

export function mergeCandidate(cwd, sha, base = "origin/main") {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid upstream commit")
  run("git", ["-c", "core.hooksPath=/dev/null", "merge", "--no-commit", "--no-ff", sha], { cwd })
  assertAutomationUnchanged(cwd, base)
}
