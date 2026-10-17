import { caseActionTypes, caseStatuses, workerFacingActionLabelKey, workerFacingStatusKey } from "@kapas/domain";
import { describe, expect, it } from "vitest";

import { dictionaries, getDirection, t } from "./index";

describe("localization", () => {
  it("returns Urdu RTL and English LTR", () => {
    expect(getDirection("ur")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
  });

  it("resolves shell keys without hardcoded UI strings", () => {
    expect(t("en", "home.reportProblem")).toBe("Report a Problem");
    expect(t("ur", "home.reportProblem")).toBe("اپنی پریشانی بتائیں");
    expect(t("en", "splash.initiative")).toBe("An initiative of PUWF");
    expect(t("ur", "draft.resume")).toBe("جاری رکھیں");
  });

  it("keeps Urdu and English catalogs on the same keys", () => {
    expect(Object.keys(dictionaries.ur).sort()).toEqual(Object.keys(dictionaries.en).sort());
  });

  it("covers worker-facing status and timeline keys", () => {
    const en = new Set(Object.keys(dictionaries.en));
    for (const status of caseStatuses) {
      expect(en.has(workerFacingStatusKey[status])).toBe(true);
    }
    for (const type of caseActionTypes) {
      expect(en.has(workerFacingActionLabelKey(type))).toBe(true);
    }
  });
});
