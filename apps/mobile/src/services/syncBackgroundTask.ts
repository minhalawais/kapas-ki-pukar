import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

import { productionSyncService } from "./productionSyncService";

const SYNC_TASK = "kapas-evidence-sync";

if (!TaskManager.isTaskDefined(SYNC_TASK)) {
  TaskManager.defineTask(SYNC_TASK, async () => {
    try {
      await productionSyncService.process();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerSyncBackgroundTask() {
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return false;
  if (!(await TaskManager.isTaskRegisteredAsync(SYNC_TASK))) {
    await BackgroundTask.registerTaskAsync(SYNC_TASK, { minimumInterval: 15 });
  }
  return true;
}
