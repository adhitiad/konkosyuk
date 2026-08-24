import { status } from "@grpc/grpc-js";
import { requireAuth } from "../interceptors/auth.interceptor.js";
import type {
  ListPropertiesRequest,
  ListPropertiesResponse,
  GetPropertyRequest,
  GetPropertyResponse,
} from "../gen/konkosyuk/v1/properties_pb.js";

export async function listProperties(
  call: any,
  callback: (error: any, response?: any) => void,
) {
  try {
    const { pagination, type, city, search, is_featured, amenities, min_price, max_price } = call.request;

    callback(null, {
      properties: [],
      pagination: {
        total: 0,
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 10,
        total_pages: 0,
      },
    } satisfies ListPropertiesResponse);
  } catch (error) {
    callback({ code: status.INTERNAL, message: (error as Error).message });
  }
}

export async function getProperty(
  call: any,
  callback: (error: any, response?: any) => void,
) {
  try {
    const { id } = call.request;

    callback(null, {
      property: undefined,
      units: [],
    } satisfies GetPropertyResponse);
  } catch (error) {
    callback({ code: status.INTERNAL, message: (error as Error).message });
  }
}
