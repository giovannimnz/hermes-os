# Phase 02: DesktopClient Interface Extraction

## Goal

Extract the `window.hermesAPI` contract into a typed TypeScript interface (`src/shared/desktop/types.ts`) that both the Electron adapter and Web adapter implement. This is the foundation of the entire multi-target architecture.

## Requirements

- [R01] Create `src/shared/desktop/types.ts` with the full `DesktopClient` interface mirroring all `window.hermesAPI` methods
- [R02] `DesktopClient` includes all methods from `src/preload/index.ts` (checkInstall, verifyInstall, sendMessage, listSessions, getSessionMessages, etc.)
- [R03] Create `src/shared/desktop/DesktopRuntime` interface describing runtime capabilities (isElectron, isWeb, platform, hermesHome)
- [R04] Create `src/shared/desktop/index.ts` exporting `createDesktopClient(adapter: DesktopAdapter): DesktopClient`
- [R05] Create `src/shared/desktop/adapters/electronAdapter.ts` — wraps existing preload IPC calls as a `DesktopAdapter`
- [R06] Ensure `src/preload/index.ts` continues working identically (no breaking changes)
- [R07] All types (`Attachment`, `ChatMessage`, `DbHistoryItem`, `Session`, `Profile`, etc.) moved to `src/shared/` if not already there
- [R08] `src/renderer/src/env.d.ts` updated to reference `DesktopClient` from shared instead of inline declaration

## Verification

```bash
# R01: types.ts exists with DesktopClient
grep -c "interface DesktopClient" src/shared/desktop/types.ts
# Expected: 1

# R02: All IPC methods are in the interface
grep -c "sendMessage\|listSessions\|getSessionMessages\|createProfile\|readMemory\|kanbanCreateTask" src/shared/desktop/types.ts
# Expected: 6+

# R07: Attachment type in shared
grep "export.*Attachment" src/shared/attachments.ts | wc -l
# Expected: >= 1

# Build still passes
npm run typecheck
```

## Interface Design

```typescript
// src/shared/desktop/types.ts
export interface DesktopClient {
  // Installation (Electron-only — returns null/undefined on web)
  checkInstall(): Promise<{ installed: boolean; configured: boolean; hasApiKey: boolean }>;
  verifyInstall(): Promise<boolean>;
  startInstall(): Promise<{ success: boolean; error?: string }>;
  quitApp(): Promise<void>;

  // Chat
  sendMessage(
    message: string,
    profile?: string,
    resumeSessionId?: string,
    history?: Array<{ role: string; content: string }>,
    attachments?: Attachment[],
    contextFolder?: string,
  ): Promise<{ response: string; sessionId?: string }>;
  abortChat(): Promise<void>;

  // Streaming listeners
  onChatChunk(callback: (chunk: string) => void): () => void;
  onChatReasoningChunk(callback: (chunk: string) => void): () => void;
  onChatDone(callback: (sessionId?: string) => void): () => void;
  onChatError(callback: (error: string) => void): () => void;
  onChatToolProgress(callback: (tool: string) => void): () => void;
  onChatUsage(callback: (usage: UsageInfo) => void): () => void;

  // Sessions
  listSessions(limit?: number, offset?: number): Promise<Session[]>;
  getSessionMessages(sessionId: string): Promise<DbHistoryItem[]>;
  searchSessions(query: string, limit?: number): Promise<SearchResult[]>;
  deleteSession(sessionId: string): Promise<void>;
  listCachedSessions(limit?: number, offset?: number): Promise<CachedSession[]>;
  syncSessionCache(): Promise<CachedSession[]>;
  updateSessionTitle(sessionId: string, title: string): Promise<void>;

  // Profiles
  listProfiles(): Promise<Profile[]>;
  createProfile(name: string, clone: boolean): Promise<{ success: boolean; error?: string }>;
  deleteProfile(name: string): Promise<{ success: boolean; error?: string }>;
  setActiveProfile(name: string): Promise<boolean>;

  // Memory
  readMemory(profile?: string): Promise<MemoryState>;
  addMemoryEntry(content: string, profile?: string): Promise<{ success: boolean; error?: string }>;
  updateMemoryEntry(index: number, content: string, profile?: string): Promise<boolean>;
  removeMemoryEntry(index: number, profile?: string): Promise<boolean>;
  writeUserProfile(content: string, profile?: string): Promise<{ success: boolean; error?: string }>;

  // Soul
  readSoul(profile?: string): Promise<string>;
  writeSoul(content: string, profile?: string): Promise<boolean>;
  resetSoul(profile?: string): Promise<string>;

  // Tools
  getToolsets(profile?: string): Promise<Toolset[]>;
  setToolsetEnabled(key: string, enabled: boolean, profile?: string): Promise<boolean>;

  // Skills
  listInstalledSkills(profile?: string): Promise<Skill[]>;
  listBundledSkills(): Promise<BundledSkill[]>;
  getSkillContent(skillPath: string): Promise<string>;
  installSkill(identifier: string, profile?: string): Promise<{ success: boolean; error?: string }>;
  uninstallSkill(name: string, profile?: string): Promise<{ success: boolean; error?: string }>;

  // Models
  listModels(): Promise<Model[]>;
  addModel(name: string, provider: string, model: string, baseUrl: string): Promise<Model>;
  removeModel(id: string): Promise<boolean>;
  updateModel(id: string, fields: Record<string, string>): Promise<boolean>;

  // Credential Pool
  getCredentialPool(profile?: string): Promise<Record<string, CredentialPoolEntry[]>>;
  setCredentialPool(provider: string, entries: CredentialPoolEntry[], profile?: string): Promise<boolean>;
  addCredentialPoolEntry(provider: string, apiKey: string, label: string, profile?: string): Promise<CredentialPoolEntry[]>;

  // Providers
  discoverProviderModels(provider: string, baseUrl?: string, apiKey?: string, profile?: string): Promise<ProviderDiscoveryResult>;

  // Cron Jobs / Schedules
  listCronJobs(includeDisabled?: boolean, profile?: string): Promise<CronJob[]>;
  createCronJob(schedule: string, prompt?: string, name?: string, deliver?: string, profile?: string): Promise<{ success: boolean; error?: string }>;
  removeCronJob(jobId: string, profile?: string): Promise<{ success: boolean; error?: string }>;
  pauseCronJob(jobId: string, profile?: string): Promise<{ success: boolean; error?: string }>;
  resumeCronJob(jobId: string, profile?: string): Promise<{ success: boolean; error?: string }>;
  triggerCronJob(jobId: string, profile?: string): Promise<{ success: boolean; error?: string }>;

  // Kanban
  kanbanListBoards(includeArchived?: boolean, profile?: string): Promise<Board[]>;
  kanbanCurrentBoard(profile?: string): Promise<string | null>;
  kanbanSwitchBoard(slug: string, profile?: string): Promise<boolean>;
  kanbanCreateBoard(slug: string, name?: string, switchAfter?: boolean, profile?: string): Promise<boolean>;
  kanbanRemoveBoard(slug: string, hardDelete?: boolean, profile?: string): Promise<boolean>;
  kanbanListTasks(filters?: KanbanTaskFilters): Promise<KanbanTask[]>;
  kanbanGetTask(taskId: string, profile?: string): Promise<KanbanTask>;
  kanbanCreateTask(input: CreateTaskInput, profile?: string): Promise<KanbanTask>;
  kanbanAssignTask(taskId: string, assignee: string | null, profile?: string): Promise<boolean>;
  kanbanCompleteTask(taskId: string, result?: string, profile?: string): Promise<boolean>;
  kanbanBlockTask(taskId: string, reason?: string, profile?: string): Promise<boolean>;
  kanbanUnblockTask(taskId: string, profile?: string): Promise<boolean>;
  kanbanArchiveTask(taskId: string, profile?: string): Promise<boolean>;
  kanbanCommentTask(taskId: string, body: string, profile?: string): Promise<boolean>;
  selectFolder(): Promise<string | null>;

  // Gateway
  startGateway(): Promise<boolean>;
  stopGateway(): Promise<boolean>;
  gatewayStatus(): Promise<boolean>;

  // Config / Env
  getEnv(profile?: string): Promise<Record<string, string>>;
  setEnv(key: string, value: string, profile?: string): Promise<boolean>;
  getConfig(key: string, profile?: string): Promise<string | null>;
  setConfig(key: string, value: string, profile?: string): Promise<boolean>;
  getHermesHome(profile?: string): Promise<string>;
  getModelConfig(profile?: string): Promise<ModelConfig>;
  setModelConfig(provider: string, model: string, baseUrl: string, profile?: string): Promise<boolean>;

  // Connection
  isRemoteMode(): Promise<boolean>;
  isRemoteOnlyMode(): Promise<boolean>;
  getConnectionConfig(): Promise<ConnectionConfig>;
  setConnectionConfig(mode: "local" | "remote" | "ssh", remoteUrl: string, apiKey?: string): Promise<boolean>;
  testRemoteConnection(url: string, apiKey?: string): Promise<boolean>;

  // OAuth
  oauthLogin(provider: string, profile?: string): Promise<{ success: boolean; error?: string }>;
  cancelOAuthLogin(): Promise<boolean>;

  // Media
  readMediaFile(filePath: string): Promise<string | null>;
  saveMediaFile(src: string, name: string): Promise<boolean>;
  mediaFileExists(filePath: string): Promise<boolean>;
  showMediaMenu(src: string, name: string, labels: { open: string; saveAs: string }): void;
  stageAttachment(sessionId: string, filename: string, base64Bytes: string): Promise<string>;
  clearStagedAttachments(sessionId: string): Promise<void>;
  getPathForFile(file: File): string;

  // Hermes info
  getHermesVersion(): Promise<string | null>;
  refreshHermesVersion(): Promise<string | null>;
  runHermesDoctor(): Promise<string>;
  runHermesUpdate(): Promise<{ success: boolean; error?: string }>;

  // Claw3D
  claw3dStatus(): Promise<Claw3dStatus>;
  claw3dSetup(): Promise<{ success: boolean; error?: string }>;
  claw3dStartAll(profile?: string): Promise<{ success: boolean; error?: string }>;
  claw3dStopAll(): Promise<boolean>;
  claw3dGetLogs(): Promise<string>;

  // Updates
  checkForUpdates(): Promise<string | null>;
  downloadUpdate(): Promise<boolean>;
  installUpdate(): Promise<void>;
  getAppVersion(): Promise<string>;

  // Menu events
  onMenuNewChat(callback: () => void): () => void;
  onMenuSearchSessions(callback: () => void): () => void;

  // Backup
  runHermesBackup(profile?: string): Promise<{ success: boolean; path?: string; error?: string }>;
  runHermesImport(archivePath: string, profile?: string): Promise<{ success: boolean; error?: string }>;
  runHermesDump(): Promise<string>;

  // MCP
  listMcpServers(profile?: string): Promise<McpServer[]>;

  // Logs
  readLogs(logFile?: string, lines?: number): Promise<{ content: string; path: string }>;

  // Memory providers
  discoverMemoryProviders(profile?: string): Promise<MemoryProvider[]>;

  // API Server key
  getApiServerKeyStatus(profile?: string): Promise<{ hasKey: boolean }>;
  generateApiServerKey(profile?: string): Promise<{ key: string }>;

  // Clipboard
  copyToClipboard(text: string): Promise<void>;
}
```

## Implementation Notes

1. **Attachment type** is already at `src/shared/attachments.ts` — reuse
2. **Types not in shared yet**: `ChatMessage`, `DbHistoryItem`, `Session`, `Profile`, `CachedSession`, `SearchResult`, `Model`, `Toolset`, `Skill`, `BundledSkill`, `CronJob`, `KanbanTask`, `Board`, `McpServer`, `MemoryProvider`, `Claw3dStatus` — move to `src/shared/`
3. **ElectronAdapter**: wraps `window.hermesAPI` calls 1:1 (preload already implements the interface)
4. **No logic changes** — just type extraction and adapter wrapping
5. Keep preload working exactly as-is for Electron target

## Notes

Dependencies: Phase 01 (fork setup)
