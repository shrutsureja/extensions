import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const execFilePromise = promisify(execFile);

export const MIN_SUPPORTED_DB_VERSION = 34;

export const ZED_WORKSPACES_QUERY = `SELECT
  CASE WHEN remote_connection_id IS NULL THEN 'local' ELSE 'remote' END as type,
  workspace_id as id, paths, paths_order, timestamp, window_id, session_id,
  host, user, port, kind, distro, name
FROM workspaces
LEFT JOIN remote_connections ON remote_connection_id = remote_connections.id
WHERE paths IS NOT NULL AND paths != ''
ORDER BY timestamp DESC`;

const ZED_DB_PATHS = [
  join(homedir(), ".config", "zed", "db", "0-stable", "db.sqlite"),
  join(homedir(), ".local", "share", "zed", "db", "0-stable", "db.sqlite"),
];

export function getZedDbPath(): string | null {
  for (const p of ZED_DB_PATHS) {
    if (existsSync(p)) return p;
  }
  return null;
}

export async function queryDbRaw<T>(dbPath: string, query: string): Promise<T[]> {
  const { stdout } = await execFilePromise(
    "sqlite3",
    ["-json", "--init", "/dev/null", dbPath, query],
    { timeout: 10000 }
  );
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  return JSON.parse(trimmed) as T[];
}

export async function getZedWorkspaceDbVersion(dbPath: string): Promise<number> {
  try {
    const rows = await queryDbRaw<{ version: number }>(
      dbPath,
      "SELECT MAX(version) as version FROM migrations;"
    );
    return rows[0]?.version ?? 0;
  } catch {
    return 0;
  }
}

export async function getZedWorkspacesQuery(dbVersion: number): Promise<string | null> {
  if (dbVersion < MIN_SUPPORTED_DB_VERSION) return null;
  return ZED_WORKSPACES_QUERY;
}

export async function executeOnDb(dbPath: string, statement: string): Promise<void> {
  await execFilePromise("sqlite3", ["--init", "/dev/null", dbPath, statement], { timeout: 10000 });
}
