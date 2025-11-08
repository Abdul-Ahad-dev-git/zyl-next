type RuleString = string;
type RuleFn = (value: any, param?: any) => string | true;

export const RULES: Record<string, RuleFn> = {
  required: (v) => (v === undefined || v === null || v === "" ? "Required" : true),
  optional: () => true,
  nullable: () => true,
  string: (v) => (typeof v === "string" ? true : "Must be string"),
  number: (v) => (typeof v === "number" ? true : "Must be number"),
  boolean: (v) => (typeof v === "boolean" ? true : "Must be boolean"),
  email: (v) =>
    typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? true
      : "Must be a valid email",
  min: (v, param) => {
    if (v === undefined || v === null) return true;
    if (typeof v === "string" || Array.isArray(v)) return v.length >= param ? true : `Min length ${param}`;
    if (typeof v === "number") return v >= param ? true : `Min value ${param}`;
    return true;
  },
  max: (v, param) => {
    if (v === undefined || v === null) return true;
    if (typeof v === "string" || Array.isArray(v)) return v.length <= param ? true : `Max length ${param}`;
    if (typeof v === "number") return v <= param ? true : `Max value ${param}`;
    return true;
  },
  object: (v) => (typeof v === "object" && v !== null && !Array.isArray(v) ? true : "Must be object"),
  array: (v) => (Array.isArray(v) ? true : "Must be array"),
};

export type RulesToType<
  R extends Record<string, RuleString>,
  N extends Record<string, typeof BaseDTO | [typeof BaseDTO]> = {}
> = {
  [K in keyof R]:
    K extends keyof N
      ? N[K] extends [typeof BaseDTO]
        ? RulesToType<InstanceType<N[K][0]>["__rules"], InstanceType<N[K][0]>["__nested"]>[]
        : N[K] extends typeof BaseDTO
        ? RulesToType<InstanceType<N[K]>["__rules"], InstanceType<N[K]>["__nested"]>
        : any
      : R[K] extends `${string}number${string}`
      ? number
      : R[K] extends `${string}boolean${string}`
      ? boolean
      : string;
};

export class BaseDTO<
  R extends Record<string, RuleString> = {},
  N extends Record<string, typeof BaseDTO | [typeof BaseDTO]> = {}
> {
  public data: RulesToType<R, N>;
  static rules: Record<string, RuleString> = {};
  static nested?: Record<string, typeof BaseDTO | [typeof BaseDTO]>;
  __rules!: R;
  __nested!: N;

  constructor(input: Record<string, any>) {
    this.data = this.validate(input) as RulesToType<R, N>;
  }

  private validate(input: Record<string, any>): Record<string, any> {
    const rules = (this.constructor as typeof BaseDTO).rules;
    const nestedRules = (this.constructor as typeof BaseDTO).nested || {};
    const sanitized: Record<string, any> = {};
    const errors: string[] = [];

    for (const field of Object.keys(rules)) {
      const ruleStr = rules[field];
      const ruleList = ruleStr.split("|").map((r) => r.trim());
      const value = input[field];

      const isOptional = ruleList.includes("optional");
      const isNullable = ruleList.includes("nullable");

      if (isOptional && value === undefined) continue;

      if (ruleList.includes("required")) {
        const result = RULES["required"](value);
        if (result !== true) {
          errors.push(`${field}: ${result}`);
          continue;
        }
      }

      if (isNullable && value === null) {
        sanitized[field] = null;
        continue;
      }

      if (nestedRules[field]) {
        try {
          if (Array.isArray(nestedRules[field])) {
            const DTOClass = (nestedRules[field] as [typeof BaseDTO])[0];
            if (!Array.isArray(value)) throw new Error("Must be array");
            sanitized[field] = value.map((item, i) => {
              try {
                return new DTOClass(item).data;
              } catch (e: any) {
                throw new Error(`Index ${i}: ${e.message}`);
              }
            });
          } else {
            const DTOClass = nestedRules[field] as typeof BaseDTO;
            sanitized[field] = new DTOClass(value).data;
          }
        } catch (e: any) {
          errors.push(`${field}: ${e.message}`);
          continue;
        }
      } else {
        for (const r of ruleList) {
          if (["required", "optional", "nullable"].includes(r)) continue;
          const [ruleName, rawParam] = r.split(":");
          const param = rawParam !== undefined ? (isNaN(+rawParam) ? rawParam : +rawParam) : undefined;
          const fn = RULES[ruleName];
          if (!fn) {
            errors.push(`Unknown rule "${ruleName}" for field ${field}`);
            continue;
          }
          const result = fn(value, param);
          if (result !== true) errors.push(`${field}: ${result}`);
        }
        if (value !== undefined) sanitized[field] = value;
      }
    }

    if (errors.length > 0) throw new Error(errors.join("; "));
    return sanitized;
  }
}
