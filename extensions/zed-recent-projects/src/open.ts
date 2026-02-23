import { closeMainWindow, showToast, Toast } from "@vicinae/api";
import { openWithZed, detectZedPath } from "./lib/zed";

export default async function Command() {
  const zedPath = await detectZedPath();
  if (!zedPath) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Zed not found",
      message: "Install Zed and ensure the 'zed' command is in your PATH.",
    });
    return;
  }

  const cwd = process.env.PWD ?? process.cwd();

  try {
    await closeMainWindow();
    await openWithZed(zedPath, [cwd]);
  } catch (err) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open with Zed",
      message: String(err),
    });
  }
}
