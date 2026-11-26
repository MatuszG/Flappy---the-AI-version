/**
 * Universal Portable Workspace Snapshot Sync (localStorage + custom state)
 * Drop-in utility for 1-click JSON Backup & Restore across Web, Tauri Desktop, and Capacitor Android.
 */

export interface WorkspaceSnapshotV1 {
  schema: string;
  exportedAt: string;
  storage: Record<string, string>;
  extra?: Record<string, unknown>;
}

export interface WorkspaceSyncOptions {
  /** Schema identifier, e.g. 'my-app-workspace-v1' */
  schemaId?: string;
  /** Prefixes of localStorage keys to include (empty array = include all keys) */
  keyPrefixes?: string[];
  /** Default filename prefix when downloading */
  filePrefix?: string;
}

export function exportWorkspaceSnapshot(
  options: WorkspaceSyncOptions = {},
  extraPayload?: Record<string, unknown>
): WorkspaceSnapshotV1 {
  const schema = options.schemaId ?? 'universal-workspace-v1';
  const prefixes = options.keyPrefixes ?? [];
  const storage: Record<string, string> = {};

  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const matches =
        prefixes.length === 0 || prefixes.some((prefix) => key.startsWith(prefix));
      if (matches) {
        const val = window.localStorage.getItem(key);
        if (val !== null) storage[key] = val;
      }
    }
  }

  return {
    schema,
    exportedAt: new Date().toISOString(),
    storage,
    ...(extraPayload ? { extra: extraPayload } : {}),
  };
}

export function downloadWorkspaceBackup(
  options: WorkspaceSyncOptions = {},
  extraPayload?: Record<string, unknown>
): number {
  const snapshot = exportWorkspaceSnapshot(options, extraPayload);
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const datePart = snapshot.exportedAt.slice(0, 10);
  const filePrefix = options.filePrefix ?? 'workspace-backup';
  a.href = url;
  a.download = `${filePrefix}-${datePart}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return Object.keys(snapshot.storage).length;
}

export function restoreWorkspaceSnapshot(
  rawJson: string,
  options: WorkspaceSyncOptions = {}
): { restoredCount: number; extra?: Record<string, unknown> } {
  const parsed = JSON.parse(rawJson) as Partial<WorkspaceSnapshotV1>;
  if (!parsed || typeof parsed.storage !== 'object' || parsed.storage === null) {
    throw new Error('Invalid workspace backup JSON format.');
  }

  const prefixes = options.keyPrefixes ?? [];
  let restoredCount = 0;

  for (const [key, val] of Object.entries(parsed.storage)) {
    const allowed =
      prefixes.length === 0 || prefixes.some((prefix) => key.startsWith(prefix));
    if (allowed && typeof val === 'string') {
      window.localStorage.setItem(key, val);
      restoredCount++;
    }
  }

  return { restoredCount, extra: parsed.extra };
}
