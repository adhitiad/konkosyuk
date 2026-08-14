import { type Instrumentation } from "next";
import * as Sentry from "@sentry/nextjs";
import { register } from "./sentry.server.config";

export { register };

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  Sentry.captureException(err, {
    tags: {
      "nextjs.route-type": context.routeType,
      "nextjs.router-kind": context.routerKind,
    },
    extra: {
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      renderSource: context.renderSource,
    },
  });
};
