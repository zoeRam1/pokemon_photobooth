/**
 * Minimal typing for the claude.ai artifact runtime. Outside claude.ai,
 * `window.claude` is undefined and the app falls back to plain browser APIs.
 */
export interface DownloadsError { code: string; message: string }
export interface DownloadsApi {
  save(req: { filename: string; data: string | Blob | ArrayBuffer | ArrayBufferView }): Promise<{ status: "saved" | "delivered" }>;
}
declare global {
  interface Window {
    claude?: { use(name: "downloads"): Promise<DownloadsApi | null>; use(name: string): Promise<unknown> };
  }
}
