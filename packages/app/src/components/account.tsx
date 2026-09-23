import { Button } from "@opencode-ai/ui/button"
import { Show, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { useLanguage } from "@/context/language"
import type { AccountPlatform, AccountState } from "../account"

export function AccountSettings(props: { account: AccountPlatform }) {
  const language = useLanguage()
  const [view, setView] = createStore<{ account: AccountState; busy: boolean; failed: boolean }>({
    account: { status: "signed-out" },
    busy: true,
    failed: false,
  })
  const refresh = async () => {
    const account = await props.account.state().catch((): AccountState => ({ status: "error" }))
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
    <section class="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-6" aria-label={language.t("account.title")}>
      <h2 class="text-16-medium">{language.t("account.title")}</h2>
      <p class="text-14-regular text-text-weak">{language.t("account.description")}</p>
      <p role="status" aria-live="polite">
        {language.t(`account.${view.account.status}`)}
      </p>
      <Show when={view.failed}>
        <p role="alert">{language.t("account.error")}</p>
      </Show>
      <Show when={view.account.status === "signed-in"}>
        <dl class="flex flex-col gap-2">
          <dt>{language.t("account.displayName")}</dt>
          <dd>{view.account.displayName || language.t("account.noName")}</dd>
          <dt>{language.t("account.email")}</dt>
          <dd>{view.account.email}</dd>
        </dl>
      </Show>
      <div class="flex flex-wrap gap-2">
        <Show when={view.account.status !== "signed-in"}>
          <Button
            disabled={view.busy || view.account.status === "unconfigured"}
            onClick={() => void run(() => props.account.signIn())}
          >
            {language.t("account.signIn")}
          </Button>
        </Show>
        <Button
          variant="secondary"
          disabled={view.busy || view.account.status === "unconfigured"}
          onClick={() => void run(() => props.account.openAccount())}
        >
          {language.t("account.manage")}
        </Button>
        <Show when={["signed-in", "signing-in", "error"].includes(view.account.status)}>
          <Button variant="ghost" disabled={view.busy} onClick={() => void run(() => props.account.signOut())}>
            {language.t("account.signOut")}
          </Button>
        </Show>
      </div>
    </section>
  )
}
