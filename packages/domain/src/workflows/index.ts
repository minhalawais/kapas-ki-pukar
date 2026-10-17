import type { QuestionNode } from "../workflow";

import { childLabourNodes } from "./childLabour";
import { commonNodes } from "./common";
import { contractorNodes } from "./contractor";
import { discriminationNodes } from "./discrimination";
import { forcedLabourNodes } from "./forcedLabour";
import { harassmentNodes } from "./harassment";
import { healthSafetyNodes } from "./healthSafety";
import { otherNodes } from "./other";
import { pesticideNodes } from "./pesticide";
import { sanitationNodes } from "./sanitation";
import { wagesNodes } from "./wages";
import { workingHoursNodes } from "./workingHours";

export const allWorkflowNodes: QuestionNode[] = [
  ...commonNodes,
  ...wagesNodes,
  ...pesticideNodes,
  ...healthSafetyNodes,
  ...harassmentNodes,
  ...childLabourNodes,
  ...forcedLabourNodes,
  ...contractorNodes,
  ...workingHoursNodes,
  ...sanitationNodes,
  ...discriminationNodes,
  ...otherNodes,
];

export const workflowNodeMap = new Map(allWorkflowNodes.map((node) => [node.id, node]));

export function getWorkflowNode(id: string): QuestionNode | undefined {
  return workflowNodeMap.get(id);
}
