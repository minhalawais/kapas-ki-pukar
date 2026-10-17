import { complaintService } from "@kapas/mock-services";
import { useQuery } from "@tanstack/react-query";

export function useMyComplaints() {
  return useQuery({
    queryKey: ["my-complaints"],
    queryFn: () => complaintService.listMine(),
  });
}
