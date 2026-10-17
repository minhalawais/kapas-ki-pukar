import type { RightsTopic } from "@kapas/domain";
import { RIGHTS_TOPICS } from "@kapas/mock-data";

export const rightsContentService = {
  async list(): Promise<RightsTopic[]> {
    return RIGHTS_TOPICS;
  },
  async getById(id: string): Promise<RightsTopic | null> {
    return RIGHTS_TOPICS.find((topic) => topic.id === id) ?? null;
  },
};
