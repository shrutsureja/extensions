import { dirname, basename } from "path";
import { Workspace, ZedWorkspaceType, getPrimaryPath } from "./workspaces";
export interface Entry {
  id: number;
  paths: string[];
  uri: string;
  title: string;
  subtitle: string;
  type: ZedWorkspaceType;
  isOpen?: boolean;
  wsl?: { user: string | null; distro: string | null } | null;
}

export function getEntryPrimaryPath(entry: Entry): string {
  return entry.paths[0] ?? "";
}

export function isEntryMultiFolder(entry: Entry): boolean {
  return entry.paths.length > 1;
}

export function getEntry(workspace: Workspace): Entry | null {
  try {
    const primaryPath = getPrimaryPath(workspace);

    const suffix = workspace.wsl
      ? ` [WSL: ${workspace.wsl.distro}]`
      : workspace.type === "remote"
        ? " [SSH: " + workspace.host + "]"
        : "";

    const title =
      workspace.paths.length > 1
        ? workspace.paths.map((p) => decodeURIComponent(basename(p)) || p).join(", ")
        : decodeURIComponent(basename(primaryPath)) || primaryPath;

    const subtitle = dirname(primaryPath).replace(process.env.HOME || "", "~") + suffix;
  return {
      id: workspace.id,
      type: workspace.type,
      paths: workspace.paths,
      uri: workspace.uri,
      title,
      subtitle,
      isOpen: workspace.isOpen,
      wsl: workspace.wsl,
    };
  } catch {
    return null;
  }
}
