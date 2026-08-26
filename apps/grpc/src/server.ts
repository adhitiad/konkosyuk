import { Server, ServerCredentials } from "@grpc/grpc-js";
import { loadPackageDefinition } from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import { register, login, refreshSession, getMe, logout } from "./services/auth.service.js";
import { listProperties, getProperty } from "./services/property.service.js";

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

server.addService(konkosyukV1.AuthService.service, {
  Register: register,
  Login: login,
  RefreshSession: refreshSession,
  GetMe: getMe,
  Logout: logout,
});

server.addService(konkosyukV1.PropertyService.service, {
  ListProperties: listProperties,
  GetProperty: getProperty,
});

const PORT = process.env.PORT || "50051";

server.bindAsync(`0.0.0.0:${PORT}`, ServerCredentials.createInsecure(), () => {
  console.log(`gRPC server running on 0.0.0.0:${PORT}`);
});

process.on("SIGINT", () => {
  console.log("Shutting down gRPC server...");
  server.forceShutdown();
  process.exit(0);
});
