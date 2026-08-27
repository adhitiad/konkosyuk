import { Counter, Gauge, Registry } from "prom-client";

export const registry = new Registry();

export const bullmqJobsActive = new Gauge({
  name: "bullmq_jobs_active",
  help: "Number of active BullMQ jobs per queue",
  labelNames: ["queue"],
  registers: [registry],
});

export const bullmqJobsCompleted = new Counter({
  name: "bullmq_jobs_completed",
  help: "Total number of completed BullMQ jobs per queue",
  labelNames: ["queue"],
  registers: [registry],
});

export const bullmqJobsFailed = new Counter({
  name: "bullmq_jobs_failed",
  help: "Total number of failed BullMQ jobs per queue",
  labelNames: ["queue"],
  registers: [registry],
});

export const bullmqQueueLength = new Gauge({
  name: "bullmq_queue_length",
  help: "Current length of BullMQ queues",
  labelNames: ["queue"],
  registers: [registry],
});
