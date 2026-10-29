import { type DatabaseClient } from "@kapas/database";
import { Controller, Get, Inject, UseGuards } from "@nestjs/common";

import { RequirePermission, StaffAuthorizationGuard } from "./authorization";
import { DATABASE_CLIENT } from "./tokens";

@Controller("api/v1/reference-data")
@UseGuards(StaffAuthorizationGuard)
@RequirePermission("case.read")
export class ReferenceDataController {
  public constructor(@Inject(DATABASE_CLIENT) private readonly client: DatabaseClient) {}

  @Get("locations")
  async locations() {
    return this.client.complaintLocation.findMany({
      distinct: ["province", "district"],
      select: { province: true, district: true },
      orderBy: [{ province: "asc" }, { district: "asc" }],
    });
  }
}
