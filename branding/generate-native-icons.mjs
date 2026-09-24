// Deterministic packaging of the approved image; run on macOS when the source icon changes.
import { execFileSync } from "node:child_process"
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, resolve, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const original = join(root, "brand-kit/assets/unlimit-code-icon-original.png")
const output = join(root, "branding/native-icons")
const iconset = join(output, "app.iconset")
if (process.platform !== "darwin") throw new Error("Native icon regeneration requires macOS sips and iconutil")
await mkdir(iconset, { recursive: true })
await copyFile(original, join(output, "icon.png"))
for (const size of [16, 32, 48, 64, 128, 256, 512, 1024]) {
  execFileSync(
    "/usr/bin/sips",
    ["--resampleHeightWidth", String(size), String(size), original, "--out", join(output, `${size}x${size}.png`)],
    { stdio: "ignore" },
  )
}
for (const size of [16, 32, 128, 256, 512]) {
  await copyFile(join(output, `${size}x${size}.png`), join(iconset, `icon_${size}x${size}.png`))
  await copyFile(join(output, `${size * 2}x${size * 2}.png`), join(iconset, `icon_${size}x${size}@2x.png`))
}
execFileSync("/usr/bin/iconutil", ["-c", "icns", iconset, "-o", join(output, "icon.icns")])
await rm(iconset, { recursive: true })
const sizes = [16, 32, 48, 64, 128, 256]
const images = await Promise.all(sizes.map((size) => readFile(join(output, `${size}x${size}.png`))))
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
const offset = { value: header.length }
images.forEach((png, index) => {
  const entry = 6 + 16 * index
  header[entry] = sizes[index] % 256
  header[entry + 1] = sizes[index] % 256
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(png.length, entry + 8)
  header.writeUInt32LE(offset.value, entry + 12)
  offset.value += png.length
})
await writeFile(join(output, "icon.ico"), Buffer.concat([header, ...images]))
await copyFile(join(output, "512x512.png"), join(output, "dock.png"))
const files = [
  "icon.png",
  "icon.icns",
  "icon.ico",
  "dock.png",
  ...[16, 32, 48, 64, 128, 256, 512, 1024].map((size) => `${size}x${size}.png`),
]
const hashes = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => [
      file,
      createHash("sha256")
        .update(await readFile(join(output, file)))
        .digest("hex"),
    ]),
  ),
)
await writeFile(join(output, "checksums.json"), JSON.stringify(hashes, null, 2) + "\n")
await copyFile(join(output, "128x128.png"), join(root, "packages/app/public/unlimit-code-icon.png"))
console.log("Packaged approved icon as PNG, macOS ICNS and Windows ICO.")
