import { Icon, Image } from "@vicinae/api";
import { SearchResult } from "./types";
const googleIcon: Image = {
  source: { light: "https://www.google.com/favicon.ico", dark: "https://www.google.com/favicon.ico" },
  mask: Image.Mask.RoundedRectangle,
};

export const getIcon = (item: SearchResult): Icon | Image => {
  if (item.isHistory) {
    return Icon.Clock;
  } else if (item.isNavigation) {
    return Icon.Link;
  } else {
    return googleIcon;
  }
};
