import { execFile } from "child_process";
import { promisify } from "util";

const execFilePromise = promisify(execFile);

export async function getGitBranch(projectPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFilePromise("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: projectPath,
    });
    const branch = stdout.trim();
    return branch === "HEAD" ? undefined : branch;
  } catch {
    return undefined;
  }
}
