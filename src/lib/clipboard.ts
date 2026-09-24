// Clipboard writes for the app. Under Tauri, go through the clipboard-manager
// plugin: WKWebView only honours `navigator.clipboard.writeText` while the
// click's user activation is still live, and any awaited IPC call before the
// write (e.g. `export_review` for "Copy for agents") consumes it, so the write
// rejects with NotAllowedError (#66). The plugin writes via the OS clipboard and
// has no gesture requirement. Outside Tauri (dev:mock / tests) the browser API
// is all there is.
import { isTauri } from "@tauri-apps/api/core";
import { writeText as tauriWriteText } from "@tauri-apps/plugin-clipboard-manager";

export async function copyText(text: string): Promise<void> {
  if (isTauri()) {
    await tauriWriteText(text);
    return;
  }
  await navigator.clipboard.writeText(text);
}
