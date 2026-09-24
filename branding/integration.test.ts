import { expect, test } from "bun:test"
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { candidate, mergeCandidate, run, validationEnvironment } from "./integration.mjs"
import { plan, digest } from "./brand.mjs"

test("upstream selection rejects drafts, prereleases and downgrade while keeping stable branches deterministic", () => {
  expect(candidate({ tagName: "v1.18.33" }, "v1.18.32")).toBe("codex/upstream-v1.18.33")
  expect(candidate({ tagName: "v1.18.32" }, "v1.18.32")).toBeNull()
  for (const release of [
    { tagName: "v1.18.31" },
    { tagName: "v1.18.33", isDraft: true },
    { tagName: "v1.18.33", isPrerelease: true },
    { tagName: "v1.18.33-beta.1" },
    { tagName: "--bad" },
  ])
    expect(() => candidate(release, "v1.18.32")).toThrow()
})

test("validation subprocesses cannot inherit publishing, artifact or model credentials", () => {
  expect(
    validationEnvironment({
      PATH: "/bin",
      HOME: "/tmp/test",
      CI: "true",
      GH_TOKEN: "secret",
      GITHUB_TOKEN: "secret",
      GITHUB_OUTPUT: "/tmp/output",
      ACTIONS_RUNTIME_TOKEN: "secret",
      OPENROUTER_API_KEY: "secret",
      AWS_SECRET_ACCESS_KEY: "secret",
      CUSTOM_PUBLISH_CREDENTIAL: "secret",
    }),
  ).toEqual({ PATH: "/bin", HOME: "/tmp/test", CI: "true" })
})

test("real upstream merge keeps the branding overlay and passes idempotent reapplication", async () => {
  await rehearsal(async (root, git) => {
    await writeFile(join(root, "engine.txt"), "engine version two\n")
    const sha = commitCandidate(git)
    mergeCandidate(root, sha)
    expect(await plan(root)).toEqual([])
    expect(await readFile(join(root, "packages/app/src/logo.ts"), "utf8")).toContain("Unlimit Code")
    expect(await readFile(join(root, "engine.txt"), "utf8")).toBe("engine version two\n")
    git(["commit", "-qm", "chore(upstream): rehearse clean merge"])
    git(["bundle", "create", join(root, "candidate.bundle"), "HEAD", "^origin/main"])
    expect(git(["bundle", "list-heads", join(root, "candidate.bundle")])).toContain("HEAD")
  })
})

test("a conflicting upstream logo update stops without overwriting the maintained files", async () => {
  await rehearsal(async (root, git) => {
    await writeFile(join(root, "packages/app/src/logo.ts"), 'export const logo = "OpenCode new logo"\n')
    const sha = commitCandidate(git)
    expect(() => mergeCandidate(root, sha)).toThrow()
    expect(git(["diff", "--name-only", "--diff-filter=U"])).toContain("packages/app/src/logo.ts")
    expect(await readFile(join(root, "branding/logo.ts"), "utf8")).toBe('export const logo = "Unlimit Code"\n')
  })
})

test("new upstream automation and unreviewed branding stop before dependency execution", async () => {
  await rehearsal(async (root, git) => {
    await mkdir(join(root, ".github/workflows"), { recursive: true })
    await writeFile(join(root, ".github/workflows/release.yml"), "name: upstream release\n")
    const sha = commitCandidate(git)
    expect(() => mergeCandidate(root, sha)).toThrow("automation")
  })
  await rehearsal(async (root, git) => {
    await writeFile(join(root, "packages/app/src/new.ts"), 'export const label = "OpenCode"\n')
    const sha = commitCandidate(git)
    mergeCandidate(root, sha)
    await expect(plan(root)).rejects.toThrow("new unreviewed display branding")
  })
})

function commitCandidate(git: (args: string[]) => string) {
  git(["add", "."])
  git(["commit", "-qm", "chore: upstream change"])
  const sha = git(["rev-parse", "HEAD"])
  git(["checkout", "-q", "main"])
  return sha
}

async function rehearsal(action: (root: string, git: (args: string[]) => string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "unlimit-integration-"))
  const git = (args: string[]) => run("git", ["-c", "core.hooksPath=/dev/null", ...args], { cwd: root })
  try {
    await mkdir(join(root, "packages/app/src"), { recursive: true })
    const upstream = 'export const logo = "OpenCode"\n'
    await writeFile(join(root, "packages/app/src/logo.ts"), upstream)
    await writeFile(join(root, "engine.txt"), "engine version one\n")
    git(["init", "-q", "-b", "main"])
    git(["config", "user.name", "Integration test"])
    git(["config", "user.email", "integration@example.invalid"])
    git(["add", "."])
    git(["commit", "-qm", "chore: upstream baseline"])
    git(["branch", "upstream"])
    await mkdir(join(root, "branding"))
    await writeFile(join(root, "branding/brand.json"), JSON.stringify({ name: "Unlimit Code" }))
    await writeFile(join(root, "branding/text-targets.json"), "{}")
    await writeFile(
      join(root, "branding/overlays.json"),
      JSON.stringify([
        { target: "packages/app/src/logo.ts", source: "branding/logo.ts", upstreamSha256: digest(upstream) },
      ]),
    )
    await writeFile(join(root, "branding/logo.ts"), 'export const logo = "Unlimit Code"\n')
    for (const change of await plan(root)) await writeFile(join(root, change.path), change.content)
    git(["add", "."])
    git(["commit", "-qm", "feat: maintained branding"])
    git(["update-ref", "refs/remotes/origin/main", "HEAD"])
    git(["checkout", "-q", "upstream"])
    await action(root, git)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}
