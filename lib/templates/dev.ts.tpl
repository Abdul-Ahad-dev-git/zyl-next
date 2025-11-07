import { NextResponse } from "next/server";
import { BaseDTO } from "./baseDTO";

export type GuardFn = (req: Request) => Promise<any> | any;

export type WrappedRequest = {
  body: any;
  query: any;
  params: any;
  user?: any;
  raw: Request;
};

// Allow any subclass of BaseDTO for DTOs
export function wrapHandler<
  B extends new (...args: any[]) => BaseDTO = any,
  Q extends new (...args: any[]) => BaseDTO = any,
  P extends new (...args: any[]) => BaseDTO = any
>(
  handler: (req: WrappedRequest, ctx?: any) => Promise<any> | any,
  config: {
    route: string;
    method: string;
    guard?: GuardFn | GuardFn[];
    bodyDTO?: B;
    queryDTO?: Q;
    paramsDTO?: P;
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
        if (config.bodyDTO) body = new config.bodyDTO(body).data;
      }

      // --- Extract and validate query
      const url = new URL(req.url);
      let query = Object.fromEntries(url.searchParams.entries());
      if (config.queryDTO) query = new config.queryDTO(query).data;

      // --- Extract and validate route params
      let params: any = {};
      if (ctx?.params) {
        params = typeof ctx.params === "function"
          ? await ctx.params()
          : await ctx.params;
      }
      if (config.paramsDTO) params = new config.paramsDTO(params).data;

      // --- Create wrapper request object
      const wrappedReq: WrappedRequest = { body, query, params, user, raw: req };

      // --- Call handler
      const result = await handler(wrappedReq, ctx);
      return NextResponse.json({ ok: true, data: result }, { status: 200 });
    } catch (err: any) {
      const message = err?.message || "Internal Server Error";
      const status =
        err?.statusCode ||
        err?.status ||
        (message.toLowerCase().includes("unauthorized") ? 401 : 500);
      return NextResponse.json({ ok: false, error: message }, { status });
    }
  };
}
