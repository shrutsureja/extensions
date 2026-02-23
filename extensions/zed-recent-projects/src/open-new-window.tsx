import { closeMainWindow, showToast, Toast } from "@vicinae/api";
import { detectZedPath, openNewZedWindow } from "./lib/zed";

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

  try {
    await closeMainWindow();
    await openNewZedWindow(zedPath);
  } catch (err) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open new Zed window",
      message: String(err),
    });
  }
}
