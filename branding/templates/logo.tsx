import { type ComponentProps } from "solid-js"
import icon from "../assets/brand/icon.png"

export const Mark = (props: { class?: string }) => (
  <svg data-component="logo-mark" class={props.class} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <rect width="64" height="64" fill="#fdfcfc" />
    <image href={icon} width="64" height="64" />
  </svg>
)

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => (
  <svg
    ref={props.ref}
    data-component="logo-splash"
    class={props.class}
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
  >
    <rect width="100" height="100" fill="#fdfcfc" />
    <image href={icon} width="100" height="100" />
  </svg>
)

export const Logo = (props: { class?: string }) => (
  <svg data-component="logo" class={props.class} viewBox="0 0 360 64" fill="none" aria-label="Unlimit Code" role="img">
    <rect width="64" height="64" fill="#fdfcfc" />
    <image href={icon} width="64" height="64" />
    <text x="76" y="43" fill="currentColor" font-family="IBM Plex Mono, monospace" font-size="36" font-weight="500">
      Unlimit Code
    </text>
  </svg>
)
