import { chmod, copyFile, mkdir } from "node:fs/promises"
import { resolve } from "node:path"
import development from "../../../branding/cli-development.json"
import { releaseAccountConfig } from "@unlimitcode/account/release-config"
import brand from "../../../branding/brand.json"

const channel = process.env.OPENCODE_CHANNEL ?? "dev"
if (!["dev", "beta", "prod"].includes(channel)) throw new Error("Unknown CLI release channel")
const config =
  channel === "dev"
    ? development
    : await (async () => {
        if (
          !brand.releaseEnabled ||
          process.env.UNLIMIT_RELEASE_APPROVED !== "true" ||
          !process.env.UNLIMIT_ACCOUNT_CONFIG
        )
          throw new Error("Release approval and production account configuration are required")
        return releaseAccountConfig(
          await Bun.file(process.env.UNLIMIT_ACCOUNT_CONFIG).json(),
          channel as "beta" | "prod",
          "cli",
        )
      })()
const directory = resolve(import.meta.dirname, "..")
const engine = process.platform === "win32" ? "opencode.exe" : "opencode"
const source = resolve(
  directory,
  `../opencode/dist/opencode-${process.platform === "win32" ? "windows" : process.platform}-${process.arch}/bin/${engine}`,
)
if (process.argv.includes("--with-engine")) {
  const build = Bun.spawn(
    [process.execPath, "run", "script/build.ts", "--single", "--skip-install", "--skip-embed-web-ui"],
    {
      cwd: resolve(directory, "../opencode"),
      env: {
        ...process.env,
        OPENCODE_CHANNEL: channel,
        OPENCODE_VERSION: brand.upstream.tag.slice(1),
        OPENCODE_RELEASE: "",
      },
      stdout: "inherit",
      stderr: "inherit",
    },
  )
  if ((await build.exited) !== 0) throw new Error("Fork engine build failed")
}
await mkdir(resolve(directory, "dist"), { recursive: true })
const result = await Bun.build({
  entrypoints: [resolve(directory, "src/index.ts")],
  target: "node",
  format: "esm",
  outdir: resolve(directory, "dist"),
  naming: "unlimitcode.mjs",
  banner: "#!/usr/bin/env node",
  define: { __UNLIMIT_ACCOUNT_CONFIG__: JSON.stringify(config), __UNLIMIT_CHANNEL__: JSON.stringify(channel) },
})
if (!result.success) throw new AggregateError(result.logs, "CLI build failed")
await chmod(resolve(directory, "dist/unlimitcode.mjs"), 0o755)
if (process.argv.includes("--with-engine")) {
  await copyFile(source, resolve(directory, `dist/unlimit-engine${process.platform === "win32" ? ".exe" : ""}`))
  await chmod(resolve(directory, "dist/unlimit-engine"), 0o755).catch((error: NodeJS.ErrnoException) => {
    if (process.platform !== "win32" || error.code !== "ENOENT") throw error
  })
}
await Bun.write(
  resolve(directory, "dist/version.json"),
  JSON.stringify(
    {
      product: brand.productVersion,
      upstream: brand.upstream,
      development: channel === "dev",
      channel,
      platform: process.platform,
      arch: process.arch,
    },
    null,
    2,
  ) + "\n",
)
console.log(
  `Built Unlimit Code ${channel} CLI launcher` +
    (process.argv.includes("--with-engine") ? " and local engine" : " (engine packaging is separate)"),
)
