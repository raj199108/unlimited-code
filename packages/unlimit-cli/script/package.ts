import { createHash } from "node:crypto"
import { copyFile, mkdir } from "node:fs/promises"
import { resolve } from "node:path"

// Run on each target OS/architecture after building and OS-signing the engine/runtime.
// This stages an archive; publication still requires a signed catalog and release verification.
const root = resolve(import.meta.dirname, "..")
const version = await Bun.file(resolve(root, "dist/version.json")).json()
if (
  version.development ||
  !["prod", "beta"].includes(version.channel) ||
  version.platform !== process.platform ||
  version.arch !== process.arch ||
  version.product.includes("-beta.") !== (version.channel === "beta") ||
  !["darwin", "win32"].includes(process.platform) ||
  !/^[0-9]+\.[0-9]+\.[0-9]+(?:-beta\.[0-9]+)?$/.test(version.product)
)
  throw new Error("Build an approved release for this operating system and architecture first")
if (
  !process.env.UNLIMIT_NODE_BINARY ||
  !process.env.UNLIMIT_NODE_LICENSE ||
  !/^[a-f0-9]{64}$/.test(process.env.UNLIMIT_NODE_SHA256 ?? "")
)
  throw new Error("Provide an official Node runtime, its license, and its independently verified SHA-256")
const bytes = await Bun.file(process.env.UNLIMIT_NODE_BINARY).arrayBuffer()
if (createHash("sha256").update(new Uint8Array(bytes)).digest("hex") !== process.env.UNLIMIT_NODE_SHA256)
  throw new Error("Node runtime checksum mismatch")
const binary = process.platform === "win32" ? ".exe" : ""
const bundle = resolve(root, "dist/bundle")
await mkdir(bundle, { recursive: true })
await Promise.all([
  copyFile(process.env.UNLIMIT_NODE_BINARY, resolve(bundle, `node${binary}`)),
  copyFile(process.env.UNLIMIT_NODE_LICENSE, resolve(bundle, "LICENSE-node")),
  copyFile(resolve(root, "../../LICENSE"), resolve(bundle, "LICENSE")),
  copyFile(resolve(root, "dist/unlimitcode.mjs"), resolve(bundle, "unlimitcode.mjs")),
  copyFile(resolve(root, `dist/unlimit-engine${binary}`), resolve(bundle, `unlimit-engine${binary}`)),
  copyFile(resolve(root, "dist/version.json"), resolve(bundle, "version.json")),
])
const runtime = Bun.spawn([resolve(bundle, `node${binary}`), "--version"], { stdout: "pipe", stderr: "inherit" })
const nodeVersion = await new Response(runtime.stdout).text()
if ((await runtime.exited) !== 0 || Number(nodeVersion.trim().slice(1).split(".")[0]) < 22)
  throw new Error("The bundled Node runtime is incompatible")
if (process.platform === "darwin") {
  for (const file of ["node", "unlimit-engine"]) {
    const check = Bun.spawn(["codesign", "--verify", "--strict", "--verbose=2", resolve(bundle, file)], {
      stdout: "inherit",
      stderr: "inherit",
    })
    if ((await check.exited) !== 0) throw new Error("Sign the release executables before packaging")
  }
  await Bun.write(
    resolve(bundle, "unlimitcode"),
    `#!/bin/sh
set -eu
uc_self="$0"
if [ -L "$uc_self" ]; then uc_self=$(readlink "$uc_self"); fi
uc_dir=$(CDPATH= cd -- "$(dirname -- "$uc_self")" && pwd)
exec "$uc_dir/node" "$uc_dir/unlimitcode.mjs" "$@"
`,
  )
  const { chmod } = await import("node:fs/promises")
  await chmod(resolve(bundle, "unlimitcode"), 0o755)
}
if (process.platform === "win32") {
  const check = Bun.spawn(
    [
      "powershell.exe",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "$ErrorActionPreference='Stop'; foreach ($f in @('node.exe','unlimit-engine.exe')) { if ((Get-AuthenticodeSignature -LiteralPath $f).Status -ne 'Valid') { throw 'Release signature missing or invalid' } }",
    ],
    { cwd: bundle, stdout: "inherit", stderr: "inherit" },
  )
  if ((await check.exited) !== 0) throw new Error("Sign the release executables before packaging")
}
const filename = `unlimit-code-cli-${version.product}-${process.platform}-${process.arch}.${process.platform === "darwin" ? "tar.gz" : "zip"}`
const output = resolve(root, "dist", filename)
const files = ["LICENSE", "LICENSE-node", "version.json", "unlimitcode.mjs", `node${binary}`, `unlimit-engine${binary}`]
const archive =
  process.platform === "darwin"
    ? Bun.spawn(["tar", "-czf", output, ...files, "unlimitcode"], { cwd: bundle, stdout: "inherit", stderr: "inherit" })
    : Bun.spawn(
        [
          "powershell.exe",
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "Compress-Archive -LiteralPath 'LICENSE','LICENSE-node','version.json','unlimitcode.mjs','node.exe','unlimit-engine.exe' -DestinationPath $env:UNLIMIT_ARCHIVE_PATH -Force",
        ],
        { cwd: bundle, env: { ...process.env, UNLIMIT_ARCHIVE_PATH: output }, stdout: "inherit", stderr: "inherit" },
      )
if ((await archive.exited) !== 0) throw new Error("CLI archive creation failed")
const artifact = new Uint8Array(await Bun.file(output).arrayBuffer())
console.log(
  JSON.stringify(
    {
      filename,
      size: artifact.byteLength,
      sha256: createHash("sha256").update(artifact).digest("hex"),
      sha512: createHash("sha512").update(artifact).digest("base64"),
    },
    null,
    2,
  ),
)
