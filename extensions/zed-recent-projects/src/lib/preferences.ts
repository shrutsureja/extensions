import { getPreferenceValues } from "@vicinae/api";

interface Preferences {
  terminalApp: string;
}

export function getPreferences(): Preferences {
  return getPreferenceValues<Preferences>();
}
