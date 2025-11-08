import fs from "fs";
import path from "path";
import { log } from "../../../functions/log.js";

/**
 * Tokenizer for better parsing
 */
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const prev = text[i - 1];

    // Handle strings
    if ((char === '"' || char === "'" || char === "`") && prev !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = "";
      }
    }

    if (inString) {
      current += char;
      continue;
    }

    // Track depth
    if (char === "{" || char === "(" || char === "[") depth++;
    if (char === "}" || char === ")" || char === "]") depth--;

    // Split on commas at depth 0
    if (char === "," && depth === 0) {
      if (current.trim()) tokens.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) tokens.push(current.trim());
  return tokens;
}

/**
 * Parse Yup schema text recursively into TS type
 */
function parseYupText(text: string, context: string = "", schemaRefs: Record<string, string> = {}): string {
  text = text.trim();

  // Check for nullable modifier
  const isNullable = /\.nullable\s*\(/.test(text);

  // Handle schema references (e.g., addressSchema.required())
  // Match the schema name at the start, before any method calls
  const schemaRefMatch = text.match(/^(\w+Schema)(?:\.|$)/);
  if (schemaRefMatch) {
    const refName = schemaRefMatch[1];
    if (schemaRefs[refName]) {
      // Get the base type from the referenced schema
      const refType = parseYupText(schemaRefs[refName], refName, schemaRefs);
      
      if (isNullable) {
        return `(${refType}) | null`;
      }
      return refType;
    }
  }

  // Primitives
  if (/^yup\.string/.test(text)) {
    const type = "string";
    return isNullable ? `${type} | null` : type;
  }
  if (/^yup\.number/.test(text)) {
    const type = "number";
    return isNullable ? `${type} | null` : type;
  }
  if (/^yup\.boolean/.test(text)) {
    const type = "boolean";
    return isNullable ? `${type} | null` : type;
  }
  if (/^yup\.date/.test(text)) {
    const type = "Date";
    return isNullable ? `${type} | null` : type;
  }

  // Arrays - handle yup.array(content)
  if (/^yup\.array\s*\(/.test(text)) {
    // Find the opening parenthesis
    const arrayStart = text.indexOf("(");
    const arrayContent = extractBalancedContent(text, arrayStart + 1);
    
    if (!arrayContent || arrayContent.trim() === "") {
      // Empty array: yup.array()
      const type = "any[]";
      return isNullable ? `${type} | null` : type;
    }
    
    // Parse the content inside the array
    const innerType = parseYupText(arrayContent.trim(), "array", schemaRefs);
    const type = `${innerType}[]`;
    return isNullable ? `${type} | null` : type;
  }

  // Objects - handle both yup.object({ ... }) and .shape({ ... })
  const objectDirectMatch = text.match(/^yup\.object\s*\(\s*\{/);
  const objectShapeMatch = text.match(/^yup\.object\s*\(\s*\)\.shape\s*\(\s*\{/);
  
  if (objectDirectMatch || objectShapeMatch) {
    // Find where the object body starts
    let bodyStart: number;
    if (objectDirectMatch) {
      bodyStart = text.indexOf("{");
    } else {
      bodyStart = text.indexOf("{", text.indexOf(".shape("));
    }
    
    // Extract the object body
    const body = extractBalancedBraces(text, bodyStart + 1);
    const props = tokenize(body);

    const seen = new Set<string>();
    const tsProps = props
      .map((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) return null;

        const key = line.substring(0, colonIndex).trim();
        const val = line.substring(colonIndex + 1).trim();

        if (seen.has(key)) return null;
        seen.add(key);

        const hasRequired = /\.required\s*\(/.test(val);
        const hasOptional = /\.optional\s*\(/.test(val);
        const hasDefault = /\.default\s*\(/.test(val);
        // Field is optional if it has .optional() OR if it doesn't have .required() and doesn't have .default()
        const isOptional = hasOptional || (!hasRequired && !hasDefault);
        const optional = isOptional ? "?" : "";
        const tsType = parseYupText(val, "object", schemaRefs);

        return `${key}${optional}: ${tsType}`;
      })
      .filter(Boolean);

    const type = `{ ${tsProps.join("; ")} }`;
    return isNullable ? `(${type}) | null` : type;
  }

  // Mixed type
  if (/^yup\.mixed/.test(text)) {
    return isNullable ? "any | null" : "any";
  }

  // Lazy (can't infer type)
  if (/^yup\.lazy/.test(text)) {
    log.warn(`Lazy schema detected in ${context}, using 'any'`);
    return "any";
  }

  // Fallback
  log.warn(`Unrecognized Yup pattern: ${text.substring(0, 50)}...`);
  return "any";
}

/**
 * Extract content within balanced parentheses starting at position
 */
function extractBalancedContent(text: string, start: number): string {
  let depth = 1;
  let i = start;
  let content = "";
  let inString = false;
  let stringChar = "";

  while (i < text.length && depth > 0) {
    const char = text[i];
    const prev = i > 0 ? text[i - 1] : "";

    // Handle strings
    if ((char === '"' || char === "'" || char === "`") && prev !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = "";
      }
    }

    if (!inString) {
      if (char === "(") depth++;
      if (char === ")") {
        depth--;
        if (depth === 0) break;
      }
    }

    content += char;
    i++;
  }

  return content.trim();
}

/**
 * Extract content within balanced braces starting at position
 */
function extractBalancedBraces(text: string, start: number): string {
  let depth = 1;
  let i = start;
  let content = "";
  let inString = false;
  let stringChar = "";

  while (i < text.length && depth > 0) {
    const char = text[i];
    const prev = i > 0 ? text[i - 1] : "";

    // Handle strings
    if ((char === '"' || char === "'" || char === "`") && prev !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = "";
      }
    }

    if (!inString) {
      if (char === "{") depth++;
      if (char === "}") {
        depth--;
        if (depth === 0) break;
      }
    }

    content += char;
    i++;
  }

  return content.trim();
}

/**
 * Extract all Yup object schemas from file
 */
function extractYupSchemas(source: string): Record<string, string> {
  const results: Record<string, string> = {};
  
  // Match: export const NAME = yup.object OR export const NAME = otherSchema
  const lines = source.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/export\s+const\s+(\w+)\s*=\s*(yup\.object|\w+Schema)/);
    
    if (match) {
      const name = match[1];
      let schemaText = line;
      let depth = 0;
      let parenDepth = 0;
      let foundStart = false;

      // Track parentheses/braces to find end of schema
      for (const char of line) {
        if (char === "{") depth++;
        if (char === "}") depth--;
        if (char === "(") {
          parenDepth++;
          foundStart = true;
        }
        if (char === ")") parenDepth--;
      }

      // Continue collecting lines until we close all brackets
      // For schema references (e.g., addressSchema), just the one line is enough
      while ((depth > 0 || parenDepth > 0) && i < lines.length - 1) {
        i++;
        schemaText += "\n" + lines[i];
        
        for (const char of lines[i]) {
          if (char === "{") depth++;
          if (char === "}") depth--;
          if (char === "(") parenDepth++;
          if (char === ")") parenDepth--;
        }
      }

      results[name] = schemaText;
    }
    
    i++;
  }

  return results;
}

/**
 * Strip export declaration from schema text
 */
function stripExportDeclaration(schemaText: string): string {
  // Remove "export const NAME = " from the beginning
  return schemaText.replace(/^export\s+const\s+\w+\s*=\s*/, "").trim();
}

/**
 * Process DTO file
 */
export function processDtoFile(filePath: string) {
  if (!filePath.endsWith(".dto.ts")) return;

  try {
    const moduleDir = path.dirname(path.dirname(filePath));
    const moduleName = path.basename(moduleDir);

    const source = fs.readFileSync(filePath, "utf8");
    const schemas = extractYupSchemas(source);

    if (!Object.keys(schemas).length) {
      log.warn(`No Yup schemas found in: ${filePath}`);
      return;
    }

    // Build a map of schema references for cross-referencing
    const schemaRefs: Record<string, string> = {};
    for (const [name, schemaText] of Object.entries(schemas)) {
      schemaRefs[name] = stripExportDeclaration(schemaText);
    }

    let generatedContent = `/** ⚠️ AUTO-GENERATED TYPES FROM YUP SCHEMAS (TEXT PARSER) */\n\n`;

    for (const [name, schemaText] of Object.entries(schemas)) {
      // Strip the export declaration before parsing
      const cleanSchema = stripExportDeclaration(schemaText);
      const tsType = parseYupText(cleanSchema, name, schemaRefs);
      generatedContent += `export type ${name} = ${tsType};\n\n`;
    }

    const typeDir = path.join(moduleDir, "Types");
    fs.mkdirSync(typeDir, { recursive: true });
    fs.writeFileSync(path.join(typeDir, "types.ts"), generatedContent, "utf8");

    log.success(`Generated types for module: ${moduleName} (text parser)`);
  } catch (err: any) {
    log.error(err.message);
  }
}