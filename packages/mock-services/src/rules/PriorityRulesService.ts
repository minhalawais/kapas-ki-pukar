import type { ComplaintContext, Priority } from "@kapas/domain";
import { getMinimumPriority, reconcilePriority } from "@kapas/domain";

export const priorityRulesService = {
  getMinimumPriority(context: ComplaintContext): Priority {
    return getMinimumPriority(context);
  },
  reconcile(aiSuggested: Priority, minimum: Priority): Priority {
    return reconcilePriority(aiSuggested, minimum);
  },
};
