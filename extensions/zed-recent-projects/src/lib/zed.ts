import { execFile } from "child_process";
import { promisify } from "util";
import { getZedDbPath, getZedWorkspaceDbVersion, getZedWorkspacesQuery, queryDbRaw } from "./db";
import { ZedWorkspace, Workspace, parseZedWorkspace } from "./workspaces";

const execFilePromise = promisify(execFile);

export interface ZedContext {
  zedPath: string;
  dbPath: string;
  dbVersion: number;
}

export async function detectZedPath(): Promise<string | null> {
  try {
    const { stdout } = await execFilePromise("which", ["zed"]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function getZedContext(): Promise<ZedContext | null> {
  const zedPath = await detectZedPath();
  if (!zedPath) return null;

  const dbPath = getZedDbPath();
  if (!dbPath) return null;

  const dbVersion = await getZedWorkspaceDbVersion(dbPath);
  return { zedPath, dbPath, dbVersion };
}

export async function getRecentWorkspaces(context: ZedContext): Promise<Workspace[]> {
  const query = await getZedWorkspacesQuery(context.dbVersion);
  if (!query) return [];

  const rows = await queryDbRaw<ZedWorkspace>(context.dbPath, query);
  return rows
    .map((row) => parseZedWorkspace(row))
    .filter((w): w is Workspace => w !== null);
}

export async function openWithZed(zedPath: string, paths: string[]): Promise<void> {
  const { spawn } = await import("child_process");
  const child = spawn(zedPath, paths, { detached: true, stdio: "ignore" });
  child.unref();
}

export async function openNewZedWindow(zedPath: string): Promise<void> {
  const { spawn } = await import("child_process");
  const child = spawn(zedPath, ["-n"], { detached: true, stdio: "ignore" });
  child.unref();
}
