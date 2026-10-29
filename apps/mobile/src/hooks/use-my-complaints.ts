import { useQuery } from "@tanstack/react-query";

import { listWorkerComplaints } from "../services/workerApi";

export function useMyComplaints() {
  return useQuery({
    queryKey: ["my-complaints"],
    queryFn: listWorkerComplaints,
  });
}
