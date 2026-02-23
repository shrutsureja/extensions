import { execFile } from "child_process";
import { promisify } from "util";

const execFilePromise = promisify(execFile);

export async function showInFileManager(path: string): Promise<void> {
  await execFilePromise("xdg-open", [path]);
}

export async function getSelectedFileManagerPath(): Promise<string | null> {
  return null;
}
