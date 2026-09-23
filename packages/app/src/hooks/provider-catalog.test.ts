import { expect, test } from "bun:test"
import type { NormalizedProviderListResponse } from "@opencode-ai/session-ui/context"
import { resolveDefaultModel, selectProviderCatalog, selectManagedCatalog } from "./provider-catalog"

const catalog = (id: string): NormalizedProviderListResponse => ({
  all: new Map([[id, { id, name: id, source: "api", env: [], options: {}, models: {} }]]),
  connected: [id],
  default: { [id]: `${id}-model` },
})

test("managed selection hides other providers and removed or signed-out models", () => {
  const source = catalog("unlimitcode")
  const provider = source.all.get("unlimitcode")!
  // This filter only depends on the catalog keys; keep the opaque model payloads small.
  const first = { id: "openai/gpt-6-astra", name: "GPT-6 Astra" } as (typeof provider.models)[string]
  const second = { id: "anthropic/claude-fable-5.1", name: "Claude Fable 5.1" } as (typeof provider.models)[string]
  provider.models = { [first.id]: first, [second.id]: second }
  source.all.set("openai", catalog("openai").all.get("openai")!)
  const filtered = selectManagedCatalog(source, new Set([second.id]))
  expect([...filtered.all.keys()]).toEqual(["unlimitcode"])
  expect(Object.keys(filtered.all.get("unlimitcode")!.models)).toEqual([second.id])
  expect(filtered.default.unlimitcode).toBe(second.id)
  expect(selectManagedCatalog(source).all.size).toBe(0)
  expect(Object.keys(provider.models)).toHaveLength(2)
})

test("selects the ready catalog for an explicit directory", () => {
  const directory = catalog("directory")

  expect(
    selectProviderCatalog({
      explicit: true,
      directory: "/repo",
      catalog: { ready: true, providers: directory },
    }),
  ).toBe(directory)
})

test("returns an empty catalog while an explicit directory is unresolved", () => {
  expect(selectProviderCatalog({ explicit: true })).toEqual({ all: new Map(), connected: [], default: {} })
  expect(
    selectProviderCatalog({
      explicit: true,
      directory: "/repo",
      catalog: { ready: false, providers: catalog("directory") },
    }),
  ).toEqual({ all: new Map(), connected: [], default: {} })
})

test("uses the route catalog when it is ready", () => {
  const directory = catalog("directory")

  expect(
    selectProviderCatalog({
      explicit: false,
      directory: "/repo",
      catalog: { ready: true, providers: directory },
      global: catalog("global"),
    }),
  ).toBe(directory)
})

test("falls back to the global catalog for route consumers", () => {
  const global = catalog("global")

  expect(selectProviderCatalog({ explicit: false, global })).toBe(global)
  expect(
    selectProviderCatalog({
      explicit: false,
      directory: "/repo",
      catalog: { ready: false, providers: catalog("directory") },
      global,
    }),
  ).toBe(global)
})

test("uses the current server default model", () => {
  expect(resolveDefaultModel({ providerID: "openai", modelID: "gpt-5" }, "anthropic/claude")).toEqual({
    providerID: "openai",
    modelID: "gpt-5",
  })
})

test("does not use legacy config when the current server has no default", () => {
  expect(resolveDefaultModel(null, "anthropic/claude")).toBeUndefined()
})

test("uses config for legacy servers", () => {
  expect(resolveDefaultModel(undefined, "anthropic/claude")).toEqual({
    providerID: "anthropic",
    modelID: "claude",
  })
})
