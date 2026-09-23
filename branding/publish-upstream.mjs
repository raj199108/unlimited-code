// Runs from trusted main in a fresh job. Never installs dependencies or executes candidate code.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs"
import { resolve, join } from "node:path"
import { tmpdir } from "node:os"
import { run, candidate, assertAutomationUnchanged } from "./integration.mjs"

const directory = resolve(process.argv[2] ?? "")
const report = JSON.parse(readFileSync(join(directory, "report.json"), "utf8"))
const brand = JSON.parse(readFileSync("branding/brand.json", "utf8"))
if (
  !process.env.GH_TOKEN ||
  brand.repository !== "raj199108/unlimited-code" ||
  brand.upstream.repository !== "anomalyco/opencode"
)
  throw new Error("Publishing requires the scoped integration credential and expected repositories")
const branch = candidate({ tagName: report.tag, isDraft: false, isPrerelease: false }, brand.upstream.tag)
if (
  !branch ||
  report.branch !== branch ||
  report.status !== "prepared" ||
  !/^[a-f0-9]{40}$/.test(report.head) ||
  !/^[a-f0-9]{40}$/.test(report.upstreamSha)
)
  throw new Error("Invalid prepared integration")
run("git", ["bundle", "verify", join(directory, "candidate.bundle")])
run("git", ["fetch", join(directory, "candidate.bundle"), "HEAD:refs/remotes/prepared/candidate"])
if (run("git", ["rev-parse", "refs/remotes/prepared/candidate"]) !== report.head)
  throw new Error("Prepared commit mismatch")
run("git", ["fetch", `https://github.com/${brand.upstream.repository}.git`, `refs/tags/${report.tag}`])
if (run("git", ["rev-parse", "FETCH_HEAD^{commit}"]) !== report.upstreamSha) throw new Error("Upstream tag mismatch")
run("git", ["merge-base", "--is-ancestor", "origin/main", report.head])
run("git", ["merge-base", "--is-ancestor", report.upstreamSha, report.head])
assertAutomationUnchanged(process.cwd(), "origin/main", report.head)
const integrated = JSON.parse(run("git", ["show", `${report.head}:branding/brand.json`]))
if (
  integrated.upstream?.tag !== report.tag ||
  integrated.upstream?.sha !== report.upstreamSha ||
  integrated.repository !== brand.repository
)
  throw new Error("Candidate baseline metadata mismatch")
if (run("git", ["ls-remote", "--heads", "origin", `refs/heads/${branch}`]))
  throw new Error("Integration branch already exists")
// checkout credentials are not persisted; gh supplies the write credential only for this fixed branch push.
run("git", [
  "-c",
  "core.hooksPath=/dev/null",
  "-c",
  "credential.helper=",
  "-c",
  "credential.helper=!gh auth git-credential",
  "push",
  "origin",
  `${report.head}:refs/heads/${branch}`,
])
const temp = mkdtempSync(join(tmpdir(), "unlimit-pr-"))
try {
  const body = join(temp, "body.md")
  writeFileSync(
    body,
    `Integrates upstream stable ${report.tag} (${report.upstreamSha}) into Unlimit Code.\n\nRead-only preparation passed branding drift checks, branding and managed-account/provider tests, package typechecks, and app/desktop builds. Preparation reports are attached to the workflow run. The candidate was prepared without publishing credentials.\n\nThis draft still requires review, native signing/install/upgrade acceptance and actual paid-provider tests. No merge, deployment or release is performed.\n`,
  )
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
      `chore(upstream): integrate ${report.tag}`,
      "--body-file",
      body,
    ]),
  )
} finally {
  rmSync(temp, { recursive: true, force: true })
}
