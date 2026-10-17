import { dictionaries } from "@kapas/localization";
import { describe, expect, it } from "vitest";

import en from "./locales/en.json";
import ur from "./locales/ur.json";

describe("mobile locale files", () => {
  it("stay aligned with the shared localization package", () => {
    expect(en).toEqual(dictionaries.en);
    expect(ur).toEqual(dictionaries.ur);
  });
});
