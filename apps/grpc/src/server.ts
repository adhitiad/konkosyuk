import { Server, ServerCredentials } from "@grpc/grpc-js";
import { loadPackageDefinition } from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import { register, login, refreshSession, getMe, logout } from "./services/auth.service.js";
import { listProperties, getProperty } from "./services/property.service.js";

import { grpcRequestsTotal, grpcRequestDurationSeconds, grpcActiveConnections, registry } from "./lib/metrics.js";
import { logInfo } from "@konkosyuk/shared/lib/logger";
import { performHealthCheck, performReadinessCheck } from "./http-health.js";

const PROTO_PATH = new URL("../proto/konkosyuk/v1/konkosyuk.proto", import.meta.url).pathname;

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDefinition = loadPackageDefinition(packageDefinition);
const konkosyukV1 = (protoDefinition as any).konkosyuk.v1;

const server = new Server();

function wrapHandler(
  methodName: string,
  handler: (_call: any, _callback: (_error: any, _response?: any) => void) => void,
) {
  return (_call: any, callback: (_error: any, _response?: any) => void) => {
    const start = Date.now();
    let statusCode = "UNKNOWN";
    grpcActiveConnections.inc();

    const wrappedCallback = (err: any, response?: any) => {
      if (err) {
        statusCode = err.code?.name || "UNKNOWN";
      } else {
        statusCode = "OK";
      }
      const duration = (Date.now() - start) / 1000;
      grpcRequestsTotal.labels(methodName, statusCode).inc();
      grpcRequestDurationSeconds.labels(methodName).observe(duration);
      grpcActiveConnections.dec();
      callback(err, response);
    };

    try {
      handler(_call, wrappedCallback);
    } catch (error) {
      statusCode = "INTERNAL";
      const duration = (Date.now() - start) / 1000;
      grpcRequestsTotal.labels(methodName, statusCode).inc();
      grpcRequestDurationSeconds.labels(methodName).observe(duration);
      grpcActiveConnections.dec();
      callback({ code: 13, message: (error as Error).message });
    }
  };
}

server.addService(konkosyukV1.AuthService.service, {
  Register: wrapHandler("Register", register),
  Login: wrapHandler("Login", login),
  RefreshSession: wrapHandler("RefreshSession", refreshSession),
  GetMe: wrapHandler("GetMe", getMe),
  Logout: wrapHandler("Logout", logout),
});

server.addService(konkosyukV1.PropertyService.service, {
  ListProperties: wrapHandler("ListProperties", listProperties),
  GetProperty: wrapHandler("GetProperty", getProperty),
});

const GRPC_PORT = process.env.PORT || "50051";
const METRICS_PORT = process.env.METRICS_PORT || "9090";

server.bindAsync(`0.0.0.0:${GRPC_PORT}`, ServerCredentials.createInsecure(), () => {
  logInfo("gRPC server started", { service: "grpc", port: GRPC_PORT });
});

process.on("SIGINT", () => {
  logInfo("Shutting down gRPC server", { service: "grpc" });
  server.forceShutdown();
  process.exit(0);
});

if (typeof Bun !== "undefined") {
  const metricsServer = Bun.serve({
    port: parseInt(METRICS_PORT),
    fetch: async (req) => {
      const url = new URL(req.url);
      if (url.pathname === "/metrics") {
        const metrics = await registry.metrics();
        return new Response(metrics, {
          headers: { "Content-Type": "text/plain; version=0.0.4" },
        });
      }

      if (url.pathname === "/health") {
        const health = await performHealthCheck();
        return new Response(JSON.stringify(health), {
          headers: { "Content-Type": "application/json" },
          status: health.status === "healthy" ? 200 : 503,
        });
      }

      if (url.pathname === "/ready") {
        const readiness = await performReadinessCheck();
        return new Response(JSON.stringify(readiness), {
          headers: { "Content-Type": "application/json" },
          status: readiness.status === "healthy" ? 200 : 503,
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });
  logInfo("Metrics server started", { service: "grpc", port: metricsServer.port });
}
