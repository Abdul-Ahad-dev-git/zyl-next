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
export declare function wrapHandler(handler: (req: WrappedRequest, ctx?: any) => Promise<any> | any, config: {
    route: string;
    method: string;
    guard?: GuardFn | GuardFn[];
    bodySchema?: YupSchema;
    querySchema?: YupSchema;
    paramsSchema?: YupSchema;
}): (req: Request, ctx: any) => Promise<any>;
//# sourceMappingURL=wrapHandler.d.ts.map