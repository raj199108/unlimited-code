// Preparation only. This process must never receive a publishing credential or push a branch.
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs"
import { resolve } from "node:path"
import { run, candidate, mergeCandidate, validationEnvironment } from "./integration.mjs"

const brand = JSON.parse(readFileSync("branding/brand.json", "utf8"))
const reportDirectory = resolve(process.env.RUNNER_TEMP ?? "branding/reports", "upstream-integration")
mkdirSync(reportDirectory, { recursive: true })
const report = { status: "blocked", previous: brand.upstream, checkedAt: new Date().toISOString() }
const output = (key, value) => {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}
try {
  if (run("git", ["status", "--porcelain"])) throw new Error("Use a clean checkout for upstream integration")
  if (brand.repository !== "raj199108/unlimited-code" || brand.upstream.repository !== "anomalyco/opencode")
    throw new Error("Unexpected repository configuration")
  const release = JSON.parse(
    run("gh", ["release", "view", "--repo", brand.upstream.repository, "--json", "tagName,isPrerelease,isDraft"]),
  )
  const branch = candidate(release, brand.upstream.tag)
  if (!branch) {
    report.status = "current"
    console.log(`Already at ${release.tagName}`)
  } else if (run("git", ["ls-remote", "--heads", "origin", `refs/heads/${branch}`])) {
    report.status = "existing"
    console.log(`${branch} already exists; review that integration`)
  } else {
    run("git", ["fetch", `https://github.com/${brand.upstream.repository}.git`, `refs/tags/${release.tagName}`])
    const sha = run("git", ["rev-parse", "FETCH_HEAD^{commit}"])
    run("git", ["merge-base", "--is-ancestor", brand.upstream.sha, sha])
    run("git", ["checkout", "-b", branch, "origin/main"])
    mergeCandidate(process.cwd(), sha)
    const env = validationEnvironment(process.env)
    const check = (command, args, cwd = ".") => run(command, args, { cwd, env, stdio: "inherit" })
    check("node", ["branding/brand.mjs", "apply"])
    check("node", ["branding/brand.mjs", "check"])
    check("bun", ["install", "--frozen-lockfile"])
    check("node", ["branding/brand.mjs", "check"])
    check("bun", ["test"], "branding")
    for (const cwd of [
      "packages/ui",
      "packages/app",
      "packages/tui",
      "packages/desktop",
      "packages/opencode",
      "packages/account",
      "packages/unlimit-cli",
    ])
      check("bun", ["typecheck"], cwd)
    check("bun", ["test", "src/managed"], "packages/desktop")
    check(
      "bun",
      ["test", "test/config/unlimit.test.ts", "test/server/httpapi-global.test.ts", "test/provider/provider.test.ts"],
      "packages/opencode",
    )
    check(
      "bun",
      [
        "test",
        "--conditions=solid",
        "--preload",
        "./happydom.ts",
        "./src/theme-preload.test.ts",
        "./src/hooks/provider-catalog.test.ts",
        "./src/pages/layout/helpers.test.ts",
      ],
      "packages/app",
    )
    check("bun", ["run", "test"], "packages/account")
    check("bun", ["run", "test"], "packages/unlimit-cli")
    check("bun", ["run", "build", "--with-engine"], "packages/unlimit-cli")
    check("node", ["script/smoke.mjs"], "packages/unlimit-cli")
    check("bun", ["run", "build"], "packages/app")
    check("bun", ["run", "build"], "packages/desktop")
    brand.upstream = { ...brand.upstream, tag: release.tagName, sha }
    writeFileSync("branding/brand.json", JSON.stringify(brand, null, 2) + "\n")
    run("git", ["add", "-A"])
    run("git", ["-c", "core.hooksPath=/dev/null", "commit", "-m", `chore(upstream): integrate ${release.tagName}`])
    run("git", ["bundle", "create", `${reportDirectory}/candidate.bundle`, "HEAD", "^origin/main"])
    Object.assign(report, {
      status: "prepared",
      branch,
      tag: release.tagName,
      upstreamSha: sha,
      head: run("git", ["rev-parse", "HEAD"]),
    })
  }
  output("prepared", report.status === "prepared" ? "true" : "false")
} catch (error) {
  report.reason = "Merge, automation drift, branding drift or validation failed; inspect the read-only preparation log."
  console.error("Integration stopped; nothing was pushed or published.")
  throw error
} finally {
  writeFileSync(`${reportDirectory}/report.json`, JSON.stringify(report, null, 2) + "\n")
}
