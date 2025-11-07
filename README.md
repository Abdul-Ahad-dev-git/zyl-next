==========================================
📦 NEXT-ZYL — Modular API Boilerplate
==========================================

Next-Zyl is a lightweight, developer-friendly CLI + code structure
designed to help developers quickly build modular, service-based APIs 
inside Next.js (App Router) projects.

It provides a clear, layered structure using:
 - Core Layer  → handles low-level logic (e.g., database, setup)
 - Service Layer → handles business logic
 - Controller Layer → handles API flow
 - Module Layer → binds everything together
 - Route Layer → connects module to Next.js routes

------------------------------------------
🔧 QUICK OVERVIEW
------------------------------------------

Each module contains:
  - module.core.ts     → shared reusable logic
  - module.service.ts  → business logic
  - module.controller.ts → API logic (GET, POST, etc.)
  - module.module.ts   → binds core, service, and controller
  - module.route.ts    → connects routes using wrapHandler

Core structure example:
  server/
   └── modules/
       └── base/
           ├── base.core.ts
           ├── base.service.ts
           ├── base.controller.ts
           ├── base.module.ts
           └── base.route.ts

------------------------------------------
🧩 CLI USAGE
------------------------------------------

Zyl provides a simple CLI for code generation:

  $ zyl g core <name>     → generates a core file
  $ zyl g module <name>   → generates a full module set

This automatically creates boilerplate code inside `server/modules/<name>`.

------------------------------------------
⚙️ EXAMPLE MODULE
------------------------------------------

BaseModule Example:

```ts
import { BaseCore } from "../../core/base/base.core";
import { BaseService } from "./base.service";
import { BaseController } from "./base.controller";

export class BaseModule {
  public controller: BaseController;

  constructor() {
    const core = new BaseCore();
    const service = new BaseService(core);
    this.controller = new BaseController(service);
    console.log("[BaseModule] initialized");
  }
}
# zyl-next
