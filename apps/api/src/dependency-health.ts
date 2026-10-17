import { checkDatabase, createDatabaseClient, type DatabaseClient } from "@kapas/database";
import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import Redis from "ioredis";

export interface DependencyCheck {
  readonly status: "up" | "down";
  readonly latencyMs: number;
}

export interface DependencyHealthResult {
  readonly postgres: DependencyCheck;
  readonly redis: DependencyCheck;
}

export interface DependencyHealth {
  check(): Promise<DependencyHealthResult>;
  close(): Promise<void>;
}

async function timedCheck(operation: () => Promise<unknown>): Promise<DependencyCheck> {
  const startedAt = performance.now();
  try {
    await operation();
    return { status: "up", latencyMs: Math.max(0, Math.round(performance.now() - startedAt)) };
  } catch {
    return { status: "down", latencyMs: Math.max(0, Math.round(performance.now() - startedAt)) };
  }
}

@Injectable()
export class InfrastructureDependencyHealth implements DependencyHealth, OnApplicationShutdown {
  private readonly database: DatabaseClient;
  private readonly redis: Redis;

  public constructor(databaseUrl: string, redisUrl: string) {
    this.database = createDatabaseClient({ connectionString: databaseUrl });
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 3_000,
      commandTimeout: 3_000,
    });
    this.redis.on("error", () => undefined);
  }

  public async check(): Promise<DependencyHealthResult> {
    const [postgres, redis] = await Promise.all([
      timedCheck(() => checkDatabase(this.database)),
      timedCheck(async () => {
        if (this.redis.status === "wait") {
          await this.redis.connect();
        }
        await this.redis.ping();
      }),
    ]);
    return { postgres, redis };
  }

  public async close(): Promise<void> {
    await Promise.allSettled([
      this.database.$disconnect(),
      this.redis.status === "wait" ? Promise.resolve() : this.redis.quit(),
    ]);
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.close();
  }
}
