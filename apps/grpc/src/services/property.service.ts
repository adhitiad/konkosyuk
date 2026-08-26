import { status } from "@grpc/grpc-js";

export async function listProperties(
  call: any,
  callback: (_error: any, _response?: any) => void,
) {
  try {
    const { pagination, _type, _city, _search, _is_featured, _amenities, _min_price, _max_price } = call.request;

    callback(null, {
      properties: [],
      pagination: {
        total: 0,
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 10,
        total_pages: 0,
      },
    });
  } catch (error) {
    callback({ code: status.INTERNAL, message: (error as Error).message });
  }
}

export async function getProperty(
  call: any,
  callback: (_error: any, _response?: any) => void,
) {
  try {
    const { _id } = call.request;

    callback(null, {
      property: undefined,
      units: [],
    });
  } catch (error) {
    callback({ code: status.INTERNAL, message: (error as Error).message });
  }
}
