import { expect, test } from "bun:test"
import { replaceDisplay, transform, plan } from "./brand.mjs"
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFileSync } from "node:child_process"

test("changes display literals without renaming SDK imports or symbols", () => {
  const source =
    'import { OpenCode } from "@opencode-ai/client"; const client = new OpenCode(); const label = "OpenCode"; // OpenCode attribution\n'
  expect(replaceDisplay("example.ts", source, "Unlimit Code")).toBe(
    'import { OpenCode } from "@opencode-ai/client"; const client = new OpenCode(); const label = "Unlimit Code"; // OpenCode attribution\n',
  )
})

test("handles JSX and templates and is idempotent", () => {
  const source = 'const label = `OpenCode ${version}`; const logo = <span title="Open Code">OpenCode</span>'
  const next = transform("example.tsx", source, 3, "Unlimit Code")
  expect(next).toContain("`Unlimit Code ${version}`")
  expect(next).toContain(">Unlimit Code</span>")
  expect(transform("example.tsx", next, 3, "Unlimit Code")).toBe(next)
})

test("rejects removed and added occurrences", () => {
  expect(() => transform("example.ts", 'const x = "OpenCode"', 2, "Unlimit Code")).toThrow("review upstream")
  expect(() => transform("example.ts", 'const x = "OpenCode OpenCode"', 1, "Unlimit Code")).toThrow("review upstream")
})

test("preserves documentation commands, identifiers, and URLs", () => {
  const source =
    "OpenCode uses `OpenCode`.\n```ts\nconst client = new OpenCode()\n```\n[OpenCode](https://example.org/OpenCode)\n"
  expect(replaceDisplay("guide.mdx", source, "Unlimit Code")).toBe(
    "Unlimit Code uses `OpenCode`.\n```ts\nconst client = new OpenCode()\n```\n[Unlimit Code](https://example.org/OpenCode)\n",
  )
})

test("the checked-out branded source has no pending transformations", async () => {
  expect(await plan()).toEqual([])
}, 30_000)

test("unreviewed upstream names and missing targets stop integration", async () => {
  const base = await mkdtemp(join(tmpdir(), "unlimit-brand-test-"))
  try {
    await mkdir(join(base, "branding"))
    await mkdir(join(base, "packages/app/src"), { recursive: true })
    await writeFile(join(base, "branding/brand.json"), JSON.stringify({ name: "Unlimit Code" }))
    await writeFile(join(base, "branding/text-targets.json"), "{}")
    await writeFile(join(base, "branding/overlays.json"), "[]")
    await writeFile(join(base, "packages/app/src/new.ts"), 'export const name = "OpenCode"')
    execFileSync("git", ["init", "-q"], { cwd: base })
    execFileSync("git", ["add", "."], { cwd: base })
    await expect(plan(base)).rejects.toThrow("new unreviewed display branding")
    await writeFile(join(base, "branding/text-targets.json"), JSON.stringify({ "missing.ts": 1 }))
    await expect(plan(base)).rejects.toThrow("ENOENT")
    await writeFile(join(base, "branding/text-targets.json"), "{}")
    await writeFile(join(base, "branding/template.ts"), 'export const name = "Unlimit Code"')
    await writeFile(join(base, "branding/overlays.json"), JSON.stringify([
      { target: "packages/app/src/new.ts", source: "branding/template.ts", upstreamSha256: "0".repeat(64) },
    ]))
    await expect(plan(base)).rejects.toThrow("overlay target changed upstream")
    expect(await readFile(join(base, "packages/app/src/new.ts"), "utf8")).toBe('export const name = "OpenCode"')
  } finally {
    await rm(base, { recursive: true, force: true })
  }
})

test("third-party Zen and Go service names retain their actual owner", () => {
  const source = 'const label = "OpenCode"; const providers = ["OpenCode Zen", "OpenCode Go"]'
  const branded = 'const label = "Unlimit Code"; const providers = ["OpenCode Zen", "OpenCode Go"]'
  expect(transform("example.ts", source, 1, "Unlimit Code")).toBe(branded)
  expect(transform("example.ts", branded, 1, "Unlimit Code")).toBe(branded)
})
