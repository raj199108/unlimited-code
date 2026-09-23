import type { NormalizedProviderListResponse } from "@opencode-ai/session-ui/context"

const emptyProviderCatalog: NormalizedProviderListResponse = { all: new Map(), connected: [], default: {} }

export function selectManagedCatalog(
  catalog: NormalizedProviderListResponse,
  selected?: ReadonlySet<string>,
): NormalizedProviderListResponse {
  const provider = catalog.all.get("unlimitcode")
  const models = Object.fromEntries(Object.entries(provider?.models ?? {}).filter(([id]) => selected?.has(id)))
  if (!provider || !Object.keys(models).length) return emptyProviderCatalog
  return {
    all: new Map([[provider.id, { ...provider, models }]]),
    connected: [provider.id],
    default: { [provider.id]: Object.keys(models)[0] },
  }
}

type DirectoryCatalog = {
  ready: boolean
  providers: NormalizedProviderListResponse
}

type ProviderCatalogInput =
  | {
      explicit: true
      directory?: string
      catalog?: DirectoryCatalog
    }
  | {
      explicit: false
      directory?: string
      catalog?: DirectoryCatalog
      global: NormalizedProviderListResponse
    }

export function selectProviderCatalog(input: ProviderCatalogInput) {
  if (input.directory && input.catalog?.ready) return input.catalog.providers
  if (input.explicit) return emptyProviderCatalog
  return input.global
}

export function resolveDefaultModel(
  current: NormalizedProviderListResponse["defaultModel"],
  legacy: string | undefined,
) {
  if (current !== undefined) return current ?? undefined
  if (!legacy) return undefined
  const [providerID, modelID] = legacy.split("/")
  return { providerID, modelID }
}
