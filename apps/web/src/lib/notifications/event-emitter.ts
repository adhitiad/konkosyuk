import { getRedis } from "@/lib/redis";

export const eventEmitter = {
  emit(
    event: string,
    data: { userId?: string; id?: string; [key: string]: unknown },
  ) {
    if (event !== "notification" || !data.userId) return false;
    void getRedis()
      .then((redis) =>
        redis.push(`notification-events:${data.userId}`, data, 86400),
      )
      .catch(() => undefined);
    return true;
  },
};
