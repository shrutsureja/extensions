import { execFile } from "child_process";
import { promisify } from "util";
const execFilePromise = promisify(execFile);
export async function execWithOutput(
  command: string,
  args: string[],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv }
): Promise<{ stdout: string; stderr: string }> {
  return execFilePromise(command, args, options ?? {});
}
export async function execSilent(
  command: string,
  args: string[],
  options?: { cwd?: string }
): Promise<string> {
  try {
    const { stdout } = await execFilePromise(command, args, options ?? {});
    return stdout.trim();
  } catch {
    return "";
  }
}
export async function getOpenZedWindowTitles(): Promise<string[]> {
  try {
    const output = await execSilent("wmctrl", ["-l"]);
    if (!output) return [];
    return output
      .split("\n")
      .filter((line) => line.toLowerCase().includes("zed"))
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        return parts.slice(3).join(" ");
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
export async function closeZedWindow(windowTitle: string): Promise<void> {
  try {
    await execFilePromise("wmctrl", ["-c", windowTitle]);
    return;
  } catch {
    // fall through to xdotool
  }
  try {
    await execFilePromise("xdotool", ["search", "--name", windowTitle, "windowclose"]);
  } catch {
    // window may have already closed
  }
}
