import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const run = (command, args, options = {}) =>
  execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], ...options }).trim()
const brand = JSON.parse(readFileSync("branding/brand.json", "utf8"))
if (run("git", ["status", "--porcelain"])) throw new Error("Use a clean checkout for upstream integration")
const release = JSON.parse(
  run("gh", ["release", "view", "--repo", brand.upstream.repository, "--json", "tagName,isPrerelease,isDraft"]),
)
if (release.isDraft || release.isPrerelease || !/^v\d+\.\d+\.\d+$/.test(release.tagName))
  throw new Error("Expected an official stable version tag")
if (release.tagName === brand.upstream.tag) {
  console.log(`Already at ${release.tagName}`)
  process.exit(0)
}
const branch = `codex/upstream-${release.tagName}`
if (run("git", ["ls-remote", "--heads", "origin", `refs/heads/${branch}`])) {
  console.log(`${branch} already exists; review or resume that integration instead of creating a duplicate`)
  process.exit(0)
}
run("git", ["fetch", `https://github.com/${brand.upstream.repository}.git`, `refs/tags/${release.tagName}`])
const sha = run("git", ["rev-parse", "FETCH_HEAD^{commit}"])
run("git", ["checkout", "-b", branch, "origin/main"])
try {
  run("git", ["merge", "--no-commit", "--no-ff", sha])
  const unknown = readdirSync(".github/workflows").filter(
    (file) => !["brand-check.yml", "upstream-sync.yml"].includes(file),
  )
  if (unknown.length) throw new Error(`Unreviewed workflows: ${unknown.join(", ")}`)
  run("bun", ["install", "--frozen-lockfile"], { stdio: "inherit" })
  run("node", ["branding/brand.mjs", "apply"], { stdio: "inherit" })
  run("node", ["branding/brand.mjs", "check"], { stdio: "inherit" })
  run("bun", ["test"], { cwd: "branding", stdio: "inherit" })
  for (const cwd of ["packages/ui", "packages/app", "packages/tui"])
    run("bun", ["typecheck"], { cwd, stdio: "inherit" })
  run("bun", ["test", "--conditions=solid", "--preload", "./happydom.ts", "./src/theme-preload.test.ts"], {
    cwd: "packages/app",
    stdio: "inherit",
  })
} catch (error) {
  console.error(
    "Integration stopped. Inspect merge conflicts or branding drift; no branch was pushed and no release was published.",
  )
  throw error
}
brand.upstream.tag = release.tagName
brand.upstream.sha = sha
writeFileSync("branding/brand.json", JSON.stringify(brand, null, 2) + "\n")
run("git", ["add", "-A"])
run("git", ["commit", "-m", `chore(upstream): integrate ${release.tagName}`])
run("git", ["push", "-u", "origin", branch])
const directory = mkdtempSync(join(tmpdir(), "unlimit-pr-"))
const body = join(directory, "body.md")
writeFileSync(
  body,
  `Integrates upstream stable ${release.tagName} (${sha}) into the Unlimit Code fork.\n\nBranding checks, branding tests, app/theme checks, and UI/app/TUI typechecks passed. This is a draft integration: desktop builds, signed installers, managed-provider integration, and end-to-end acceptance remain required before promotion. No deployment is performed.\n`,
)
try {
  console.log(
    run("gh", [
      "pr",
      "create",
      "--repo",
      brand.repository,
      "--base",
      "main",
      "--head",
      branch,
      "--draft",
      "--title",
      `chore(upstream): integrate ${release.tagName}`,
      "--body-file",
      body,
    ]),
  )
} finally {
  rmSync(directory, { recursive: true, force: true })
}
