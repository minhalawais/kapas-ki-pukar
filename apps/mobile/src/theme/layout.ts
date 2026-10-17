import { type FlexAlignType } from "react-native";

import { layout } from "./tokens";

export function pagePadding() {
  return {
    paddingHorizontal: layout.mobilePagePaddingX,
    paddingVertical: layout.mobileSectionGap,
  };
}

export function rowDirection(): "row" {
  return "row";
}

export function startAlign(): FlexAlignType {
  return "flex-start";
}
