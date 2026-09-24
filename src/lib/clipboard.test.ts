// src/lib/clipboard.test.ts — copyText routes clipboard writes by runtime
import { describe, it, expect, vi, beforeEach } from "vitest";

const isTauri = vi.fn(() => false);
const pluginWriteText = vi.fn(async (_text: string) => {});
vi.mock("@tauri-apps/api/core", () => ({ isTauri: () => isTauri() }));
vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  writeText: (text: string) => pluginWriteText(text),
}));

import { copyText } from "./clipboard";

describe("copyText", () => {
  const browserWriteText = vi.fn(async (_text: string) => {});
  beforeEach(() => {
    isTauri.mockReset().mockReturnValue(false);
    pluginWriteText.mockClear();
    browserWriteText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: browserWriteText },
    });
  });

  it("uses the native clipboard plugin under Tauri (no user-gesture requirement)", async () => {
    // WKWebView rejects navigator.clipboard.writeText once the click's user
    // activation has been consumed by an awaited IPC call (#66); the plugin
    // writes through the OS clipboard instead, so it must be the Tauri path.
    isTauri.mockReturnValue(true);
    await copyText("hello");
    expect(pluginWriteText).toHaveBeenCalledWith("hello");
    expect(browserWriteText).not.toHaveBeenCalled();
  });

  it("falls back to navigator.clipboard outside Tauri (dev:mock / browser)", async () => {
    await copyText("hello");
    expect(browserWriteText).toHaveBeenCalledWith("hello");
    expect(pluginWriteText).not.toHaveBeenCalled();
  });

  it("propagates a rejected write so callers can show a failure state", async () => {
    isTauri.mockReturnValue(true);
    pluginWriteText.mockRejectedValueOnce(new Error("boom"));
    await expect(copyText("x")).rejects.toThrow("boom");
  });
});
