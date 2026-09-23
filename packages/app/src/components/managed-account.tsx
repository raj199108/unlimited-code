import { Button } from "@opencode-ai/ui/button"
import { For, Show, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { useLanguage } from "@/context/language"
import type { ManagedAccountPlatform, ManagedAccountState } from "../managed-account"

export function ManagedAccount(props: { account: ManagedAccountPlatform }) {
  const language = useLanguage()
  const [view, setView] = createStore<{ account: ManagedAccountState; busy: boolean; failed: boolean }>({
    account: { status: "signed-out" },
    busy: true,
    failed: false,
  })
  const refresh = async () => {
    const account = await props.account.state().catch((): ManagedAccountState => ({ status: "error" }))
    setView("account", account)
  }
  const run = async (operation: () => Promise<void>) => {
    setView({ busy: true, failed: false })
    await operation().catch(() => setView("failed", true))
    await refresh()
    setView("busy", false)
  }
  onMount(() => {
    void refresh().finally(() => setView("busy", false))
    const timer = setInterval(() => {
      if (!view.busy) void refresh()
    }, 5000)
    onCleanup(() => clearInterval(timer))
  })
  return (
    <section class="flex flex-col gap-4 p-6" aria-label={language.t("managed.account.title")}>
      <h2 class="text-16-medium">{language.t("managed.account.title")}</h2>
      <p class="text-14-regular text-text-weak">{language.t("managed.account.description")}</p>
      <p role="status" aria-live="polite">
        {language.t(`managed.account.${view.account.status}`)}
      </p>
      <Show when={view.failed}>
        <p role="alert">{language.t("managed.account.error")}</p>
      </Show>
      <Show when={view.account.status === "signed-in"}>
        <p>{view.account.email}</p>
        <p>{language.t(view.account.paid ? "managed.account.paid" : "managed.account.unpaid")}</p>
        <ul>
          <For each={view.account.models}>{(model) => <li>{model.name}</li>}</For>
        </ul>
      </Show>
      <div class="flex flex-wrap gap-2">
        <Show when={view.account.status !== "signed-in"}>
          <Button
            disabled={view.busy || view.account.status === "unconfigured"}
            onClick={() => void run(() => props.account.signIn())}
          >
            {language.t("managed.account.signIn")}
          </Button>
        </Show>
        <Button
          variant="secondary"
          disabled={view.busy || view.account.status === "unconfigured"}
          onClick={() => void run(() => props.account.openAccount())}
        >
          {language.t("managed.account.manage")}
        </Button>
        <Show when={["signed-in", "signing-in", "error"].includes(view.account.status)}>
          <Button variant="ghost" disabled={view.busy} onClick={() => void run(() => props.account.signOut())}>
            {language.t("managed.account.signOut")}
          </Button>
        </Show>
      </div>
    </section>
  )
}
