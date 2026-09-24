import { readFile, writeFile, mkdir, lstat } from "node:fs/promises"
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
export const digest = (value) => createHash("sha256").update(value).digest("hex")
// Zen and Go are third-party services; renaming them would imply that we sell them.
const displayPattern = /\bOpen ?Code\b(?! (?:Zen|Go)\b)/g
const eligible =
  /^(?:README(?:\.[\w-]+)?\.md|packages\/(?:app|desktop|ui|tui|opencode|web)\/.*\.(?:[cm]?[jt]sx?|json|html|md|mdx|astro))$/

export function literalRanges(path, text) {
  if (/\.(?:md|mdx)$/.test(path)) {
    // Documentation examples and destinations are compatibility surfaces, not display copy.
    const protectedRanges = [
      ...text.matchAll(
        /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[^\n]*(?:\n|$)|`+[^`\n]*`+|https?:\/\/[^\s)<>"']+/gm,
      ),
    ]
    const ranges = []
    let start = 0
    for (const match of protectedRanges) {
      ranges.push([start, match.index])
      start = match.index + match[0].length
    }
    ranges.push([start, text.length])
    return ranges
  }
  if (!/\.[cm]?[jt]sx?$/.test(path)) return [[0, text.length]]
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
  const result = []
  const visit = (node) => {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isJsxText(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      result.push([node.getStart(source), node.end])
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return result
}

export function displayCount(path, text, name) {
  return literalRanges(path, text).reduce((count, [start, end]) => {
    const part = text.slice(start, end)
    return count + [...part.matchAll(displayPattern)].length + (name ? part.split(name).length - 1 : 0)
  }, 0)
}

export function replaceDisplay(path, text, name) {
  return literalRanges(path, text)
    .reverse()
    .reduce(
      (result, [start, end]) =>
        result.slice(0, start) + result.slice(start, end).replace(displayPattern, name) + result.slice(end),
      text,
    )
}

export function transform(path, text, expected, name) {
  const actual = displayCount(path, text, name)
  if (actual !== expected)
    throw new Error(`${path}: expected ${expected} reviewed display names, found ${actual}; review upstream changes`)
  return replaceDisplay(path, text, name)
}

export async function plan(base = root) {
  const brand = JSON.parse(await readFile(resolve(base, "branding/brand.json"), "utf8"))
  if (brand.nativeIcons) {
    const icons = JSON.parse(await readFile(resolve(base, brand.nativeIcons), "utf8"))
    for (const [file, hash] of Object.entries(icons)) {
      if (digest(await readFile(resolve(base, dirname(brand.nativeIcons), file))) !== hash)
        throw new Error(`Native icon drift: ${file}; regenerate from the approved source`)
    }
    if (digest(await readFile(resolve(base, brand.icon))) !== icons["icon.png"])
      throw new Error("Native icon no longer matches the approved original")
    if (digest(await readFile(resolve(base, "packages/app/public/unlimit-code-icon.png"))) !== icons["128x128.png"])
      throw new Error("Notification icon no longer matches the native icon")
  }
  const targets = JSON.parse(await readFile(resolve(base, "branding/text-targets.json"), "utf8"))
  const overlays = JSON.parse(await readFile(resolve(base, "branding/overlays.json"), "utf8"))
  const changes = []
  for (const [path, count] of Object.entries(targets)) {
    const text = await readFile(resolve(base, path), "utf8")
    const next = transform(path, text, count, brand.name)
    if (next !== text) changes.push({ path, content: next })
  }
  for (const overlay of overlays) {
    const source = await readFile(resolve(base, overlay.source))
    const current = await readFile(resolve(base, overlay.target))
    if (digest(current) === digest(source)) continue
    if (digest(current) !== overlay.upstreamSha256)
      throw new Error(`${overlay.target}: overlay target changed upstream; merge it explicitly`)
    changes.push({ path: overlay.target, content: source })
  }
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: base, encoding: "utf8" }).split("\0").filter(Boolean)
  for (const path of files.filter((file) => eligible.test(file))) {
    if (targets[path] !== undefined || overlays.some((item) => item.target === path)) continue
    const text = await readFile(resolve(base, path), "utf8")
    if (displayCount(path, text)) throw new Error(`${path}: new unreviewed display branding; add a reviewed target`)
  }
  return changes
}

async function scan() {
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean)
  const matches = []
  const skipped = []
  const binaryAssets = []
  for (const path of files) {
    const info = await lstat(resolve(root, path))
    if (!info.isFile()) {
      skipped.push({ path, reason: info.isSymbolicLink() ? "symlink" : "not a regular file" })
      continue
    }
    const buffer = await readFile(resolve(root, path))
    if (buffer.includes(0)) {
      binaryAssets.push(path)
      continue
    }
    const lines = buffer.toString("utf8").split("\n")
    lines.forEach((line, index) => {
      const count = [...line.matchAll(/open[ _-]?code/gi)].length
      if (count)
        matches.push({
          path,
          line: index + 1,
          count,
          kind: /@opencode-ai\/|OPENCODE_|opencode\.json|\.opencode\//.test(line) ? "compatibility-review" : "review",
        })
    })
  }
  await mkdir(resolve(root, "branding/reports"), { recursive: true })
  await writeFile(
    resolve(root, "branding/reports/scan.json"),
    JSON.stringify({ matches, binaryAssets, skipped }, null, 2) + "\n",
  )
  console.log(
    `${matches.reduce((n, item) => n + item.count, 0)} occurrences across ${new Set(matches.map((item) => item.path)).size} files; see branding/reports/scan.json`,
  )
}

async function main() {
  const command = process.argv[2]
  if (command === "scan") return scan()
  if (!["apply", "check"].includes(command)) throw new Error("Usage: node branding/brand.mjs scan|apply|check")
  const changes = await plan()
  if (command === "check" && changes.length)
    throw new Error(`Branding is not applied: ${changes.map((item) => item.path).join(", ")}`)
  if (command === "apply") for (const change of changes) await writeFile(resolve(root, change.path), change.content)
  console.log(`${command}: ${changes.length} files ${command === "apply" ? "updated" : "pending"}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
