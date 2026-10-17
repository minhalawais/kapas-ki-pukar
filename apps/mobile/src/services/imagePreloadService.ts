import { Asset } from "expo-asset";
import type { ImageRequireSource } from "react-native";

import CHILD_STORY from "../../assets/field-guide/child-labour-rights-story.png";
import COMPENSATION_STORY from "../../assets/field-guide/compensation-rights-story.png";
import CONTRACT_STORY from "../../assets/field-guide/contractor-terms-rights-story.png";
import FACILITIES_STORY from "../../assets/field-guide/facilities-rights-story.png";
import FORCED_STORY from "../../assets/field-guide/forced-labour-rights-story.png";
import EQUALITY_STORY from "../../assets/field-guide/harassment-equality-rights-story.png";
import HEAT_STORY from "../../assets/field-guide/heat-hours-rights-story.png";
import HOME_WORKER from "../../assets/field-guide/home-worker-voice.png";
import INJURY_STORY from "../../assets/field-guide/injury-safety-rights-story.png";
import CATEGORY_ATLAS from "../../assets/field-guide/issue-category-atlas.png";
import MIGRANT_STORY from "../../assets/field-guide/migrant-tenant-rights-story.png";
import PESTICIDE_STORY from "../../assets/field-guide/pesticide-rights-story.png";
import WAGE_STORY from "../../assets/field-guide/wage-rights-story-v2.png";
import MATERNITY_STORY from "../../assets/field-guide/women-maternity-rights-story.png";
import VOICE_STORY from "../../assets/field-guide/worker-voice-rights-story.png";
import FOS_LOGO from "../../assets/FOS_logo.png";
import ILO_LOGO from "../../assets/ilo_logo.png";
import ILO_DISPLAY from "../../assets/ilo_logo_display.png";
import LOGO_MARK from "../../assets/logo-mark.png";
import PUWF_LOGO from "../../assets/puwf_logo.png";
import RIGHTS_CHILD from "../../assets/rights/child-labour.png";
import RIGHTS_COMPENSATION from "../../assets/rights/compensation.png";
import RIGHTS_CONTRACT from "../../assets/rights/contractor-terms.png";
import RIGHTS_FACILITIES from "../../assets/rights/facilities.png";
import RIGHTS_FORCED from "../../assets/rights/forced-labour.png";
import RIGHTS_EQUALITY from "../../assets/rights/harassment-equality.png";
import RIGHTS_HEAT from "../../assets/rights/heat-hours.png";
import RIGHTS_INJURY from "../../assets/rights/injury-safety.png";
import RIGHTS_MIGRANT from "../../assets/rights/migrant-tenant.png";
import RIGHTS_PESTICIDE from "../../assets/rights/pesticide.png";
import RIGHTS_HEADER from "../../assets/rights/rights-explorer-header.png";
import RIGHTS_WAGES from "../../assets/rights/wages.png";
import RIGHTS_MATERNITY from "../../assets/rights/women-maternity.png";
import RIGHTS_VOICE from "../../assets/rights/worker-voice.png";

const loaded = new Set<ImageRequireSource>();
const inFlight = new Map<ImageRequireSource, Promise<void>>();

const criticalImages = [
  LOGO_MARK,
  ILO_DISPLAY,
  HOME_WORKER,
  ILO_LOGO,
  PUWF_LOGO,
  FOS_LOGO,
] as const satisfies readonly ImageRequireSource[];

const rightsImages = [
  RIGHTS_HEADER,
  RIGHTS_WAGES,
  RIGHTS_PESTICIDE,
  RIGHTS_HEAT,
  RIGHTS_INJURY,
  RIGHTS_EQUALITY,
  RIGHTS_CHILD,
  RIGHTS_FORCED,
  RIGHTS_FACILITIES,
  RIGHTS_CONTRACT,
  RIGHTS_MATERNITY,
  RIGHTS_VOICE,
  RIGHTS_COMPENSATION,
  RIGHTS_MIGRANT,
  WAGE_STORY,
  PESTICIDE_STORY,
  HEAT_STORY,
  INJURY_STORY,
  EQUALITY_STORY,
  CHILD_STORY,
  FORCED_STORY,
  FACILITIES_STORY,
  CONTRACT_STORY,
  MATERNITY_STORY,
  VOICE_STORY,
  COMPENSATION_STORY,
  MIGRANT_STORY,
] as const satisfies readonly ImageRequireSource[];

const grievanceImages = [
  CATEGORY_ATLAS,
] as const satisfies readonly ImageRequireSource[];

function loadImage(source: ImageRequireSource): Promise<void> {
  if (loaded.has(source)) {
    return Promise.resolve();
  }
  const existing = inFlight.get(source);
  if (existing) {
    return existing;
  }
  const task = Asset.fromModule(source)
    .downloadAsync()
    .then(() => {
      loaded.add(source);
    })
    .catch(() => {
      // Keep image loading non-fatal. The Image component can still attempt to render normally.
    })
    .finally(() => {
      inFlight.delete(source);
    });
  inFlight.set(source, task);
  return task;
}

function preload(images: readonly ImageRequireSource[]): Promise<void> {
  return Promise.all(images.map(loadImage)).then(() => undefined);
}

export const imagePreloadService = {
  preloadCritical(): Promise<void> {
    return preload(criticalImages);
  },
  preloadRights(): Promise<void> {
    return preload(rightsImages);
  },
  preloadGrievance(): Promise<void> {
    return preload(grievanceImages);
  },
  warmNonCritical(): void {
    void preload([...rightsImages, ...grievanceImages]);
  },
};
