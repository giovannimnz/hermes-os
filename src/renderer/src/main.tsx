import "./assets/main.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./components/I18nProvider";
import { initAnalytics } from "./utils/analytics";

// ─────────────────────────────────────────────────────────────────────────────
// Web-build polyfill — bridges the Electron-only renderer to browser context.
//
// hermes-os is an Electron desktop app. The renderer process receives
// window.hermesAPI and window.electron from the preload script (contextBridge).
// In a plain browser/web-build those objects don't exist.
//
// This polyfill provides functional stubs for all renderer code paths so the
// app can run in remote mode against a real Hermes Agent API server.
// ─────────────────────────────────────────────────────────────────────────────

if (typeof window !== "undefined" && !(window as any).hermesAPI) {
  // ── helpers ───────────────────────────────────────────────────────────────

  function normaliseRemoteUrl(raw: string): string {
    let url = (raw || "").trim().replace(/\/+$/, ""); // strip trailing slashes
    url = url.replace(/\/v1$/i, ""); // callers append /v1/<path> themselves
    return url;
  }

  function lsGet<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`hermes:${key}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  function lsSet(key: string, val: unknown): void {
    try {
      localStorage.setItem(`hermes:${key}`, JSON.stringify(val));
    } catch {}
  }

  // ── connection config (persisted via localStorage) ────────────────────────

  interface ConnectionConfig {
    mode: "local" | "remote" | "ssh";
    remoteUrl: string;
    apiKey: string;
    hasApiKey: boolean;
    apiKeyLength: number;
    ssh: {
      host: string;
      port: number;
      username: string;
      keyPath: string;
      remotePort: number;
      localPort: number;
    };
  }

  function defaultConnConfig(): ConnectionConfig {
    return {
      mode: "local",
      remoteUrl: "",
      apiKey: "",
      hasApiKey: false,
      apiKeyLength: 0,
      ssh: { host: "", port: 22, username: "", keyPath: "", remotePort: 8642, localPort: 18642 },
    };
  }

  // ── electron stub (Versions.tsx, analytics.ts) ───────────────────────────
  (window as any).electron = {
    process: {
      platform: "browser",
      versions: { chrome: "", electron: "", node: "" },
    },
  };

  // ── hermesAPI stub ────────────────────────────────────────────────────────
  (window as any).hermesAPI = {
    // ── Installation ──────────────────────────────────────────────────────
    checkInstall: () =>
      Promise.resolve({ installed: false, hermesHome: "" }),

    verifyInstall: () => Promise.resolve(false),

    // In web/remote mode, show the server's Hermes home instead of local path.
    inspectInstallTarget: () =>
      Promise.resolve({
        hermesHome: "https://hermes-desktop.atius.com.br",
        repoPath: "/api/v1",
        state: "fresh" as const,
      }),

    startInstall: () =>
      Promise.reject(new Error("Installation is not available in web/remote mode. Use 'Connect to Remote Hermes' instead.")),

    validateHermesHome: () => Promise.resolve(false),
    adoptHermesHome: () => Promise.resolve(false),
    quitApp: () => Promise.resolve(),
    onInstallProgress: () => () => {},

    getHermesVersion: () => Promise.resolve(null),
    refreshHermesVersion: () => Promise.resolve(null),
    runHermesDoctor: () => Promise.resolve(""),
    runHermesUpdate: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    checkOpenClaw: () => Promise.resolve({ found: false, path: null }),
    runClawMigrate: () => Promise.resolve({ success: false, error: "not supported in web mode" }),

    // ── OAuth ────────────────────────────────────────────────────────────
    oauthLogin: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    cancelOAuthLogin: () => Promise.resolve(false),
    onOAuthLoginProgress: () => () => {},

    // ── Locale ───────────────────────────────────────────────────────────
    getLocale: () => Promise.resolve("en" as const),
    setLocale: () => Promise.resolve("en" as const),

    // ── Config ──────────────────────────────────────────────────────────
    getEnv: () => Promise.resolve({}),
    setEnv: () => Promise.resolve(false),
    getConfig: () => Promise.resolve(null),
    setConfig: () => Promise.resolve(false),
    getHermesHome: () => Promise.resolve(""),
    getModelConfig: () =>
      Promise.resolve({ provider: "minimax", model: "MiniMax-M2.7-hs", baseUrl: "" }),
    setModelConfig: () => Promise.resolve(false),

    // ── Connection ────────────────────────────────────────────────────────
    isRemoteMode: () =>
      Promise.resolve(lsGet<ConnectionConfig>("conn", defaultConnConfig()).mode !== "local"),

    isRemoteOnlyMode: () =>
      Promise.resolve(lsGet<ConnectionConfig>("conn", defaultConnConfig()).mode === "remote"),

    getConnectionConfig: () =>
      Promise.resolve(lsGet<ConnectionConfig>("conn", defaultConnConfig())),

    setConnectionConfig: (
      mode: "local" | "remote" | "ssh",
      remoteUrl: string,
      apiKey?: string,
    ) => {
      const prev = lsGet<ConnectionConfig>("conn", defaultConnConfig());
      const updated: ConnectionConfig = {
        ...prev,
        mode,
        remoteUrl: remoteUrl ?? prev.remoteUrl,
        apiKey: apiKey ?? prev.apiKey,
        hasApiKey: !!(apiKey ?? prev.apiKey),
        apiKeyLength: (apiKey ?? prev.apiKey).length,
      };
      lsSet("conn", updated);
      return Promise.resolve(true);
    },

    setSshConfig: (
      host: string,
      port: number,
      username: string,
      keyPath: string,
      remotePort: number,
      localPort: number,
    ) => {
      const prev = lsGet<ConnectionConfig>("conn", defaultConnConfig());
      lsSet("conn", { ...prev, mode: "ssh", ssh: { host, port, username, keyPath, remotePort, localPort } });
      return Promise.resolve(true);
    },

    testRemoteConnection: async (url: string, apiKey?: string): Promise<boolean> => {
      try {
        const target = `${normaliseRemoteUrl(url)}/health`;
        const headers: Record<string, string> = {};
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        const resp = await fetch(target, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(5000),
        });
        return resp.ok;
      } catch {
        return false;
      }
    },

    testSshConnection: () => Promise.resolve(false), // SSH not supported in browser
    isSshTunnelActive: () => Promise.resolve(false),
    startSshTunnel: () => Promise.resolve(false),
    stopSshTunnel: () => Promise.resolve(false),

    // ── Chat (remote API via fetch + SSE) ─────────────────────────────────
    sendMessage: async (
      message: string,
      _profile?: string,
      _resumeSessionId?: string,
      _history?: Array<{ role: string; content: string }>,
      _attachments?: any[],
      _contextFolder?: string,
    ): Promise<{ response: string; sessionId?: string }> => {
      const conn = lsGet<ConnectionConfig>("conn", defaultConnConfig());
      if (conn.mode !== "remote" || !conn.remoteUrl) {
        return { response: "Not connected to a remote Hermes. Please connect first." };
      }

      const apiBase = normaliseRemoteUrl(conn.remoteUrl);
      const sessionId = `web-${Date.now()}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Hermes-Session-Id": sessionId,
      };
      if (conn.apiKey) headers["Authorization"] = `Bearer ${conn.apiKey}`;

      try {
        const resp = await fetch(`${apiBase}/v1/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "hermes-agent",
            messages: [{ role: "user", content: message }],
            stream: false,
          }),
          signal: AbortSignal.timeout(60000),
        });

        if (!resp.ok) {
          const err = await resp.text();
          return { response: `API error ${resp.status}: ${err}`, sessionId };
        }

        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        return { response: content || "(no response)", sessionId };
      } catch (e: any) {
        return { response: `Connection error: ${e.message}`, sessionId };
      }
    },

    abortChat: () => Promise.resolve(),
    getApiServerKeyStatus: () => Promise.resolve({ hasKey: false }),
    generateApiServerKey: () => Promise.resolve({ key: "" }),
    copyToClipboard: () => Promise.resolve(),
    onContextMenuCopyChat: () => () => {},
    onContextMenuSelectBubble: () => () => {},
    readMediaFile: () => Promise.resolve(null),
    saveMediaFile: () => Promise.resolve(false),
    mediaFileExists: () => Promise.resolve(false),
    showMediaMenu: () => {},
    getPathForFile: () => "",
    stageAttachment: () => Promise.resolve(""),
    clearStagedAttachments: () => Promise.resolve(),
    discoverProviderModels: () =>
      Promise.resolve({ models: [], status: "no-key" as const, cached: false }),
    onChatChunk: () => () => {},
    onChatReasoningChunk: () => () => {},
    onChatDone: () => () => {},
    onChatToolProgress: () => () => {},
    onChatUsage: () => () => {},
    onChatError: () => () => {},

    // ── Gateway ───────────────────────────────────────────────────────────
    startGateway: () => Promise.resolve(false),
    stopGateway: () => Promise.resolve(false),
    gatewayStatus: () => Promise.resolve(false),

    // ── Platforms ─────────────────────────────────────────────────────────
    getPlatformEnabled: () => Promise.resolve({}),
    setPlatformEnabled: () => Promise.resolve(false),

    // ── Sessions ──────────────────────────────────────────────────────────
    listSessions: () => Promise.resolve([]),
    getSessionMessages: () => Promise.resolve([]),
    deleteSession: () => Promise.resolve(),
    updateSessionTitle: () => Promise.resolve(),
    searchSessions: () => Promise.resolve([]),
    listCachedSessions: () => Promise.resolve([]),
    syncSessionCache: () => Promise.resolve([]),

    // ── Profiles ───────────────────────────────────────────────────────────
    listProfiles: () =>
      Promise.resolve([
        {
          name: "default",
          path: "",
          isDefault: true,
          isActive: true,
          model: "MiniMax-M2.7-hs",
          provider: "minimax",
          hasEnv: false,
          hasSoul: false,
          skillCount: 0,
          gatewayRunning: false,
        },
      ]),
    createProfile: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    deleteProfile: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    setActiveProfile: () => Promise.resolve(false),

    // ── Memory ─────────────────────────────────────────────────────────────
    readMemory: () =>
      Promise.resolve({
        memory: { content: "", exists: false, lastModified: null },
        user: { content: "", exists: false, lastModified: null },
        stats: { totalSessions: 0, totalMessages: 0 },
      }),
    addMemoryEntry: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    updateMemoryEntry: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    removeMemoryEntry: () => Promise.resolve(false),
    writeUserProfile: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    discoverMemoryProviders: () => Promise.resolve([]),

    // ── Soul ───────────────────────────────────────────────────────────────
    readSoul: () => Promise.resolve(""),
    writeSoul: () => Promise.resolve(false),
    resetSoul: () => Promise.resolve(""),

    // ── Toolsets ───────────────────────────────────────────────────────────
    getToolsets: () => Promise.resolve([]),
    setToolsetEnabled: () => Promise.resolve(false),

    // ── Skills ─────────────────────────────────────────────────────────────
    listInstalledSkills: () => Promise.resolve([]),
    listBundledSkills: () => Promise.resolve([]),
    getSkillContent: () => Promise.resolve(""),
    installSkill: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    uninstallSkill: () => Promise.resolve({ success: false, error: "not supported in web mode" }),

    // ── Models ─────────────────────────────────────────────────────────────
    listModels: () => Promise.resolve([]),
    addModel: () => Promise.resolve({ id: "", name: "", provider: "", model: "", baseUrl: "", createdAt: 0 }),
    removeModel: () => Promise.resolve(false),
    updateModel: () => Promise.resolve(false),

    // ── Claw3D ────────────────────────────────────────────────────────────
    claw3dStatus: () =>
      Promise.resolve({
        cloned: false, installed: false, devServerRunning: false, adapterRunning: false,
        port: 0, portInUse: false, wsUrl: "", running: false, error: "",
      }),
    claw3dSetup: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    onClaw3dSetupProgress: () => () => {},
    claw3dGetPort: () => Promise.resolve(0),
    claw3dSetPort: () => Promise.resolve(false),
    claw3dGetWsUrl: () => Promise.resolve(""),
    claw3dSetWsUrl: () => Promise.resolve(false),
    claw3dStartAll: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    claw3dStopAll: () => Promise.resolve(false),
    claw3dGetLogs: () => Promise.resolve(""),
    claw3dStartDev: () => Promise.resolve(false),
    claw3dStopDev: () => Promise.resolve(false),
    claw3dStartAdapter: () => Promise.resolve(false),
    claw3dStopAdapter: () => Promise.resolve(false),

    // ── Updates ─────────────────────────────────────────────────────────────
    checkForUpdates: () => Promise.resolve(null),
    downloadUpdate: () => Promise.resolve(false),
    installUpdate: () => Promise.resolve(),
    getAppVersion: () => Promise.resolve("web"),
    onUpdateAvailable: () => () => {},
    onUpdateDownloadProgress: () => () => {},
    onUpdateDownloaded: () => () => {},
    onUpdateError: () => () => {},

    // ── Menu ───────────────────────────────────────────────────────────────
    onMenuNewChat: () => () => {},
    onMenuSearchSessions: () => () => {},

    // ── Cron Jobs ──────────────────────────────────────────────────────────
    listCronJobs: () => Promise.resolve([]),
    createCronJob: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    removeCronJob: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    pauseCronJob: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    resumeCronJob: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    triggerCronJob: () => Promise.resolve({ success: false, error: "not supported in web mode" }),

    // ── Kanban ─────────────────────────────────────────────────────────────
    kanbanListBoards: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanCurrentBoard: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanSwitchBoard: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanCreateBoard: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanRemoveBoard: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanListTasks: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanGetTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanCreateTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanAssignTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanCompleteTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanBlockTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanUnblockTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanArchiveTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanSpecifyTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanReclaimTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanCommentTask: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanDispatchOnce: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    kanbanListClaw3dHqTasks: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    selectFolder: () => Promise.resolve(null), // can't open folder dialog in browser

    // ── Shell ───────────────────────────────────────────────────────────────
    openExternal: (url: string) => {
      window.open(url, "_blank", "noopener,noreferrer");
      return Promise.resolve();
    },

    // ── Backup ─────────────────────────────────────────────────────────────
    runHermesBackup: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    runHermesImport: () => Promise.resolve({ success: false, error: "not supported in web mode" }),
    runHermesDump: () => Promise.resolve(""),

    // ── MCP ─────────────────────────────────────────────────────────────────
    listMcpServers: () => Promise.resolve([]),

    // ── Logs ────────────────────────────────────────────────────────────────
    readLogs: () => Promise.resolve({ content: "", path: "" }),
  };
}

// Initialize analytics (privacy-first, only if user consented and key is configured)
initAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
