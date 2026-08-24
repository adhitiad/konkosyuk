import { ServerUnaryCall, status } from "@grpc/grpc-js";
import { auth } from "../lib/auth-instance.js";

type GrpcMetadata = { [key: string]: string | string[] | Buffer | Buffer[] };

function getBearerToken(meta: GrpcMetadata): string | undefined {
  const authHeader = (meta["authorization"] ?? meta["Authorization"]) as string | string[] | undefined;
  if (!authHeader) return undefined;
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (token.startsWith("Bearer ")) return token.slice(7);
  return token;
}

export async function requireAuth(call: ServerUnaryCall<any, any>) {
  const token = getBearerToken(call.metadata as GrpcMetadata);
  if (!token) {
    throw new Error("Missing authorization token");
  }

  const session = await auth.api.getSession({
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session;
}
