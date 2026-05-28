import "./assets/main.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./components/I18nProvider";
import { initAnalytics } from "./utils/analytics";

// Web-build polyfill: stub window.electron and window.hermesAPI when not running in Electron.
// In Electron, the preload script injects these before renderer loads.
if (typeof window !== "undefined" && !(window as any).hermesAPI) {
  // Stub electron (used by Versions.tsx, analytics.ts)
  (window as any).electron = {
    process: {
      platform: "browser",
      versions: { chrome: "", electron: "", node: "" },
    },
  };

  // Stub hermesAPI — all methods return safe defaults for web/remote mode.
  // The app detects no local Hermes installation and switches to remote mode.
  (window as any).hermesAPI = {
    // Installation — stub: no local install available
    checkInstall: () => Promise.resolve({ installed: false, hermesHome: "" }),
    verifyInstall: () => Promise.resolve(false),
    inspectInstallTarget: () => Promise.reject(new Error("no local install")),
    startInstall: () => Promise.reject(new Error("not supported in web mode")),
    validateHermesHome: () => Promise.resolve(false),
    adoptHermesHome: () => Promise.resolve(false),
    quitApp: () => Promise.resolve(),
    onInstallProgress: () => () => {},
    getHermesVersion: () => Promise.resolve(null),
    refreshHermesVersion: () => Promise.resolve(null),
    runHermesDoctor: () => Promise.resolve(""),
    runHermesUpdate: () => Promise.resolve({ success: false, error: "not supported" }),
    checkOpenClaw: () => Promise.resolve({ found: false, path: null }),
    runClawMigrate: () => Promise.resolve({ success: false, error: "not supported" }),

    // OAuth — stub
    oauthLogin: () => Promise.resolve({ success: false, error: "not supported" }),
    cancelOAuthLogin: () => Promise.resolve(false),
    onOAuthLoginProgress: () => () => {},

    // Locale
    getLocale: () => Promise.resolve("en" as any),
    setLocale: () => Promise.resolve("en" as any),

    // Config
    getEnv: () => Promise.resolve({}),
    setEnv: () => Promise.resolve(false),
    getConfig: () => Promise.resolve(null),
    setConfig: () => Promise.resolve(false),
    getHermesHome: () => Promise.resolve(""),
    getModelConfig: () => Promise.resolve({ provider: "", model: "", baseUrl: "" }),
    setModelConfig: () => Promise.resolve(false),

    // Connection — remote mode by default
    isRemoteMode: () => Promise.resolve(true),
    isRemoteOnlyMode: () => Promise.resolve(true),
    getConnectionConfig: () =>
      Promise.resolve({
        mode: "remote" as const,
        remoteUrl: "",
        hasApiKey: false,
        apiKeyLength: 0,
        ssh: { host: "", port: 22, username: "", keyPath: "", remotePort: 0, localPort: 0 },
      }),
    setConnectionConfig: () => Promise.resolve(false),
    setSshConfig: () => Promise.resolve(false),
    testRemoteConnection: () => Promise.resolve(false),
    testSshConnection: () => Promise.resolve(false),
    isSshTunnelActive: () => Promise.resolve(false),
    startSshTunnel: () => Promise.resolve(false),
    stopSshTunnel: () => Promise.resolve(false),

    // Chat
    sendMessage: () => Promise.resolve({ response: "", sessionId: "" }),
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

    // Gateway
    startGateway: () => Promise.resolve(false),
    stopGateway: () => Promise.resolve(false),
    gatewayStatus: () => Promise.resolve(false),

    // Platforms
    getPlatformEnabled: () => Promise.resolve({}),
    setPlatformEnabled: () => Promise.resolve(false),

    // Sessions
    listSessions: () => Promise.resolve([]),
    getSessionMessages: () => Promise.resolve([]),
    deleteSession: () => Promise.resolve(),
    updateSessionTitle: () => Promise.resolve(),
    searchSessions: () => Promise.resolve([]),
    listCachedSessions: () => Promise.resolve([]),
    syncSessionCache: () => Promise.resolve([]),

    // Profiles
    listProfiles: () =>
      Promise.resolve([
        {
          name: "default",
          path: "",
          isDefault: true,
          isActive: true,
          model: "",
          provider: "",
          hasEnv: false,
          hasSoul: false,
          skillCount: 0,
          gatewayRunning: false,
        },
      ]),
    createProfile: () => Promise.resolve({ success: false, error: "not supported" }),
    deleteProfile: () => Promise.resolve({ success: false, error: "not supported" }),
    setActiveProfile: () => Promise.resolve(false),

    // Memory
    readMemory: () =>
      Promise.resolve({ memory: { content: "", exists: false, lastModified: null }, user: { content: "", exists: false, lastModified: null }, stats: { totalSessions: 0, totalMessages: 0 } }),
    addMemoryEntry: () => Promise.resolve({ success: false, error: "not supported" }),
    updateMemoryEntry: () => Promise.resolve({ success: false, error: "not supported" }),
    removeMemoryEntry: () => Promise.resolve(false),
    writeUserProfile: () => Promise.resolve({ success: false, error: "not supported" }),
    discoverMemoryProviders: () => Promise.resolve([]),

    // Soul
    readSoul: () => Promise.resolve(""),
    writeSoul: () => Promise.resolve(false),
    resetSoul: () => Promise.resolve(""),

    // Toolsets
    getToolsets: () => Promise.resolve([]),
    setToolsetEnabled: () => Promise.resolve(false),

    // Skills
    listInstalledSkills: () => Promise.resolve([]),
    listBundledSkills: () => Promise.resolve([]),
    getSkillContent: () => Promise.resolve(""),
    installSkill: () => Promise.resolve({ success: false, error: "not supported" }),
    uninstallSkill: () => Promise.resolve({ success: false, error: "not supported" }),

    // Models
    listModels: () => Promise.resolve([]),
    addModel: () => Promise.resolve({ id: "", name: "", provider: "", model: "", baseUrl: "", createdAt: 0 }),
    removeModel: () => Promise.resolve(false),
    updateModel: () => Promise.resolve(false),

    // Claw3D
    claw3dStatus: () =>
      Promise.resolve({
        cloned: false, installed: false, devServerRunning: false, adapterRunning: false,
        port: 0, portInUse: false, wsUrl: "", running: false, error: "",
      }),
    claw3dSetup: () => Promise.resolve({ success: false, error: "not supported" }),
    onClaw3dSetupProgress: () => () => {},
    claw3dGetPort: () => Promise.resolve(0),
    claw3dSetPort: () => Promise.resolve(false),
    claw3dGetWsUrl: () => Promise.resolve(""),
    claw3dSetWsUrl: () => Promise.resolve(false),
    claw3dStartAll: () => Promise.resolve({ success: false, error: "not supported" }),
    claw3dStopAll: () => Promise.resolve(false),
    claw3dGetLogs: () => Promise.resolve(""),
    claw3dStartDev: () => Promise.resolve(false),
    claw3dStopDev: () => Promise.resolve(false),
    claw3dStartAdapter: () => Promise.resolve(false),
    claw3dStopAdapter: () => Promise.resolve(false),

    // Updates
    checkForUpdates: () => Promise.resolve(null),
    downloadUpdate: () => Promise.resolve(false),
    installUpdate: () => Promise.resolve(),
    getAppVersion: () => Promise.resolve("web"),
    onUpdateAvailable: () => () => {},
    onUpdateDownloadProgress: () => () => {},
    onUpdateDownloaded: () => () => {},
    onUpdateError: () => () => {},

    // Menu
    onMenuNewChat: () => () => {},
    onMenuSearchSessions: () => () => {},

    // Cron Jobs
    listCronJobs: () => Promise.resolve([]),
    createCronJob: () => Promise.resolve({ success: false, error: "not supported" }),
    removeCronJob: () => Promise.resolve({ success: false, error: "not supported" }),
    pauseCronJob: () => Promise.resolve({ success: false, error: "not supported" }),
    resumeCronJob: () => Promise.resolve({ success: false, error: "not supported" }),
    triggerCronJob: () => Promise.resolve({ success: false, error: "not supported" }),

    // Kanban
    kanbanListBoards: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanCurrentBoard: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanSwitchBoard: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanCreateBoard: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanRemoveBoard: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanListTasks: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanGetTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanCreateTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanAssignTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanCompleteTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanBlockTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanUnblockTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanArchiveTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanSpecifyTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanReclaimTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanCommentTask: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanDispatchOnce: () => Promise.resolve({ success: false, error: "not supported" }),
    kanbanListClaw3dHqTasks: () => Promise.resolve({ success: false, error: "not supported" }),
    selectFolder: () => Promise.resolve(null),

    // Shell
    openExternal: () => Promise.resolve(),

    // Backup
    runHermesBackup: () => Promise.resolve({ success: false, error: "not supported" }),
    runHermesImport: () => Promise.resolve({ success: false, error: "not supported" }),
    runHermesDump: () => Promise.resolve(""),

    // MCP
    listMcpServers: () => Promise.resolve([]),

    // Logs
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
