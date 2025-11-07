let NextResponse: any;
try {
  NextResponse = require("next/server").NextResponse;
} catch (e) {
  NextResponse = {
    json: (data: any, opts: any) => data,
  };
}

import * as yup from "yup";

export type GuardFn = (req: Request) => Promise<any> | any;

export type WrappedRequest = {
  body: any;
  query: any;
  params: any;
  user?: any;
  raw: Request;
};

export type YupSchema = yup.ObjectSchema<any>;

// ---------------------- wrapHandler ----------------------
export function wrapHandler(
  handler: (req: WrappedRequest, ctx?: any) => Promise<any> | any,
  config: {
    route: string;
    method: string;
    guard?: GuardFn | GuardFn[];
    bodySchema?: YupSchema;
    querySchema?: YupSchema;
    paramsSchema?: YupSchema;
  }
) {
  return async function wrapped(req: Request, ctx: any) {
    try {
      let user: any = {};

      // --- Run guards
      if (config.guard) {
        const guards = Array.isArray(config.guard) ? config.guard : [config.guard];
        for (const guardFn of guards) {
          const result = await guardFn(req);
          if (result) user = { ...user, ...result };
        }
      }

      // --- Extract and validate body
      let body: any = {};
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) body = await req.json();
        if (config.bodySchema) body = await config.bodySchema.validate(body, { abortEarly: false });
      }

      // --- Extract and validate query
      const url = new URL(req.url);
      let query = Object.fromEntries(url.searchParams.entries());
      if (config.querySchema) query = await config.querySchema.validate(query, { abortEarly: false });

      // --- Extract and validate route params
      let params: any = {};
      if (ctx?.params) {
        params = typeof ctx.params === "function" ? await ctx.params() : await ctx.params;
      }
      if (config.paramsSchema) params = await config.paramsSchema.validate(params, { abortEarly: false });

      // --- Create wrapper request object
      const wrappedReq: WrappedRequest = { body, query, params, user, raw: req };

      // --- Call handler
      const result = await handler(wrappedReq, ctx);
      return NextResponse.json({ ok: true, data: result }, { status: 200 });
    } catch (err: any) {
      // Extract Yup errors if available
      const errors = err?.errors || [err.message || "Internal Server Error"];
      const status =
        err?.statusCode ||
        err?.status ||
        (errors.some((e: string) => e.toLowerCase().includes("unauthorized")) ? 401 : 400);
      return NextResponse.json({ ok: false, errors }, { status });
    }
  };
}
