export type ZedWorkspaceType = "local" | "remote";

export interface ZedBaseWorkspace {
  id: number;
  timestamp: number | string;
  type: ZedWorkspaceType;
  paths: string;
  paths_order: string | null;
  window_id: number | null;
  session_id: string | null;
}

export interface ZedLocalWorkspace extends ZedBaseWorkspace {
  type: "local";
}

export interface ZedRemoteWorkspace extends ZedBaseWorkspace {
  type: "remote";
  kind: string;
  host: string;
  user: string | null;
  port: number | null;
  distro: string | null;
  name: string | null;
}

export type ZedWorkspace = ZedLocalWorkspace | ZedRemoteWorkspace;

function isWslWorkspace(workspace: ZedRemoteWorkspace): boolean {
  return workspace.kind === "wsl" && !!workspace.user && !!workspace.distro;
}

export interface Workspace {
  id: number;
  lastOpened: number;
  type: ZedWorkspaceType;
  paths: string[];
  uri: string;
  host?: string;
  isOpen?: boolean;
  wsl?: { user: string | null; distro: string | null } | null;
}

export function getPrimaryPath(workspace: Workspace): string {
  return workspace.paths[0] ?? "";
}

export function isMultiFolder(workspace: Workspace): boolean {
  return workspace.paths.length > 1;
}

function parsePathsWithOrder(pathsStr: string, pathsOrder: string | null): string[] {
  const paths = pathsStr
    .split("\n")
    .map((p) => p.trim())
    .filter((p) => p);

  if (paths.length === 0) {
    return [];
  }

  if (pathsOrder) {
    const orderIndices = pathsOrder.split(",").map((i) => parseInt(i.trim(), 10));
    const orderedPaths: string[] = [];
    for (const idx of orderIndices) {
      if (idx >= 0 && idx < paths.length) {
        orderedPaths.push(paths[idx]);
      }
    }
    if (orderedPaths.length > 0) {
      return orderedPaths;
    }
  }

  return paths;
}

function parseTimestamp(timestamp: number | string): number {
  if (typeof timestamp === "number") {
    return timestamp;
  }
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }
  return 0;
}

export function parseZedWorkspace(zedWorkspace: ZedWorkspace): Workspace | null {
  if (!zedWorkspace.paths) {
    return null;
  }

  const paths = parsePathsWithOrder(zedWorkspace.paths, zedWorkspace.paths_order);

  if (paths.length === 0) {
    return null;
  }

  if (zedWorkspace.type === "local") {
    const processedPaths = paths.map((p) => p.replace(/\/+$/, ""));
    const primaryPath = processedPaths[0];
    return {
      id: zedWorkspace.id,
      lastOpened: parseTimestamp(zedWorkspace.timestamp),
      type: zedWorkspace.type,
      uri: "file://" + primaryPath,
      paths: processedPaths,
    };
  }

  if (zedWorkspace.type === "remote") {
    const processedPaths = paths.map((p) => p.replace(/^\/+/, "").replace(/\/+$/, ""));
    const primaryPath = processedPaths[0];
    const uri = `ssh://${zedWorkspace.user ? zedWorkspace.user + "@" : ""}${zedWorkspace.host}${
      zedWorkspace.port ? ":" + zedWorkspace.port : ""
    }/${primaryPath}`;

    const hasWsl = isWslWorkspace(zedWorkspace);
    const wsl = hasWsl ? { user: zedWorkspace.user, distro: zedWorkspace.distro } : null;
    return {
      id: zedWorkspace.id,
      lastOpened: parseTimestamp(zedWorkspace.timestamp),
      type: zedWorkspace.type,
      uri,
      paths: processedPaths,
      host: zedWorkspace.host,
      ...(hasWsl && { wsl }),
    };
  }
  return null;
}
