import brand from "../../../../branding/brand.json"

export const product = {
  name: brand.name,
  version: brand.productVersion,
  appIds: { dev: "ai.factso.unlimitcode.dev", beta: "ai.factso.unlimitcode.beta", prod: "ai.factso.unlimitcode" },
  schemes: { dev: "unlimitcode-dev", beta: "unlimitcode-beta", prod: "unlimitcode" },
} as const
