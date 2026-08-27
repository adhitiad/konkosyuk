import { Counter, Histogram, Gauge, Registry } from "prom-client";

export const registry = new Registry();

export const grpcRequestsTotal = new Counter({
  name: "grpc_requests_total",
  help: "Total number of gRPC requests",
  labelNames: ["method", "status_code"],
  registers: [registry],
});

export const grpcRequestDurationSeconds = new Histogram({
  name: "grpc_request_duration_seconds",
  help: "Duration of gRPC requests in seconds",
  labelNames: ["method"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const grpcActiveConnections = new Gauge({
  name: "grpc_active_connections",
  help: "Number of active gRPC connections",
  registers: [registry],
});
