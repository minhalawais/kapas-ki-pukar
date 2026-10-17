import type { ImageSourcePropType } from "react-native";

import CHILD_LABOUR from "../../../assets/rights/child-labour.png";
import COMPENSATION from "../../../assets/rights/compensation.png";
import CONTRACTOR_TERMS from "../../../assets/rights/contractor-terms.png";
import FACILITIES from "../../../assets/rights/facilities.png";
import FORCED_LABOUR from "../../../assets/rights/forced-labour.png";
import HARASSMENT_EQUALITY from "../../../assets/rights/harassment-equality.png";
import HEAT_HOURS from "../../../assets/rights/heat-hours.png";
import INJURY_SAFETY from "../../../assets/rights/injury-safety.png";
import MIGRANT_TENANT from "../../../assets/rights/migrant-tenant.png";
import PESTICIDE from "../../../assets/rights/pesticide.png";
import WAGES from "../../../assets/rights/wages.png";
import WOMEN_MATERNITY from "../../../assets/rights/women-maternity.png";
import WORKER_VOICE from "../../../assets/rights/worker-voice.png";

export const rightsImage: Record<string, ImageSourcePropType> = {
  wages: WAGES,
  pesticide: PESTICIDE,
  "heat-hours": HEAT_HOURS,
  "injury-safety": INJURY_SAFETY,
  "harassment-equality": HARASSMENT_EQUALITY,
  "child-labour": CHILD_LABOUR,
  "forced-labour": FORCED_LABOUR,
  facilities: FACILITIES,
  "contractor-terms": CONTRACTOR_TERMS,
  "women-maternity": WOMEN_MATERNITY,
  "worker-voice": WORKER_VOICE,
  compensation: COMPENSATION,
  "migrant-tenant": MIGRANT_TENANT,
};
