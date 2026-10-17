import { Redirect } from "expo-router";

import { demoControlsEnabled } from "../src/config/runtime";
import { DemoControls } from "../src/features/demo/DemoControls";

export default function DemoControlsScreen() {
  if (!demoControlsEnabled) {
    return <Redirect href="/home" />;
  }
  return <DemoControls />;
}
