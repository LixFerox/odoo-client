# @lixferox/odoo-client

[![npm version](https://img.shields.io/npm/v/@lixferox/odoo-client.svg)](https://www.npmjs.com/package/@lixferox/odoo-client)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

TypeScript SDK for Odoo XML-RPC (`/xmlrpc/2/common` and `/xmlrpc/2/object`).

> **Note**
> This library currently provides a generic Odoo XML-RPC client for common model operations.
> If you need custom high-level business workflows, build them on top of this client in your own app/service layer.

## Features

- XML-RPC authentication (`authenticate`) against `/xmlrpc/2/common`
- Generic model methods via `execute_kw` on `/xmlrpc/2/object`
- Typed operations: `create`, `copy`, `write`, `read`, `search`, `searchCount`, `unlink`
- Typed domain operators for Odoo 16-19
- Optional single-company context injection with `companyId`
- ESM + CJS build output with TypeScript declarations

## Requirements

- Bun `>= 1.0.0` (development toolchain)
- Odoo `16.0`, `17.0`, `18.0`, or `19.0`
- Valid Odoo credentials (user + password/API key)

## Important Notes & Limitations

### Scope of this SDK

- Exposes generic model operations only
- Does not include opinionated modules for HR, Sales, Accounting, etc.
- Does not include REST wrappers; transport is XML-RPC

### Multi-company behavior

- This SDK is intentionally single-company per client instance
- If `companyId` is set, requests include:
  - `context.allowed_company_ids = [companyId]`
  - `context.company_id = companyId`
- For multiple companies, create multiple `OdooClient` instances or run separate queries

### Version support behavior

- Type definitions include Odoo domain operator differences for 16-19
- Runtime behavior is generic XML-RPC and depends on your Odoo model/method availability

## When to Use This Library

### Good fit

- You need a lightweight typed XML-RPC client
- You want to call Odoo models generically from TypeScript
- You prefer building your own app-specific service layer

### Not ideal

- You need built-in domain business APIs (HR workflows, accounting policies, etc.)
- You need non-XML-RPC integration style out of the box

## Installation

```bash
bun add @lixferox/odoo-client
```

Or with npm:

```bash
npm i @lixferox/odoo-client
```

## Usage

### Basic Setup

```ts
import { OdooClient } from "@lixferox/odoo-client";

const client = new OdooClient({
	baseUrl: "https://your-odoo-instance.com",
	database: "your_db",
	email: "api-user@example.com",
	apiKey: "your_api_key_or_password",
	companyId: 1,
});
```

### Example Query

```ts
const ids = await client.search({
	model: "res.partner",
	domain: [["is_company", "=", true]],
	limit: 10,
	order: "name asc",
});

console.log(ids);
```

## API

### Constructor

```ts
new OdooClient({
	baseUrl: string;
	database: string;
	email: string;
	apiKey: string;
	version?: "16.0" | "17.0" | "18.0" | "19.0";
	companyId?: number;
});
```

`version` is optional metadata for version-aware typing/workflows and currently does not change XML-RPC runtime requests.

### Methods

- `create(args): Promise<number | number[]>`
- `copy(args): Promise<number>`
- `write(args): Promise<boolean>`
- `read(args): Promise<Record<string, unknown>[]>`
- `search(args): Promise<number[]>`
- `searchCount(args): Promise<number>`
- `unlink(args): Promise<boolean>`

### Exported Types

- `Create`, `Copy`, `Write`, `Read`, `Search`, `SearchCount`, `Unlink`
- `OdooDomain`, `OdooCondition`, `LogicalOperatorByVersion`
- `OdooContext`, `OdooVersion`, `OrderBy`

See [EXAMPLES.md](./EXAMPLES.md) for full snippets.

## Error Handling

The SDK throws if authentication fails or XML-RPC returns an error.

```ts
try {
	const count = await client.searchCount({
		model: "res.partner",
		domain: [["customer_rank", ">", 0]],
	});
	console.log(count);
} catch (error) {
	console.error("Odoo request failed:", error);
}
```

## Project Structure

```txt
src/
  base.ts
  index.ts
  types/
    common.ts
    domain.ts
    operations.ts
    index.ts
```

## Development

```bash
bun install
bun run test
bun run test:integration # optional (requires Odoo env vars)
bun run typecheck
bun run check
bun run build
```

## Integration Test (Optional)

Run against a real Odoo instance:

```bash
ODOO_TEST_BASE_URL="https://your-odoo-instance.com" \
ODOO_TEST_DATABASE="your_db" \
ODOO_TEST_EMAIL="api-user@example.com" \
ODOO_TEST_API_KEY="your_api_key_or_password" \
ODOO_TEST_COMPANY_ID="1" \
bun run test:integration
```

Required: `ODOO_TEST_BASE_URL`, `ODOO_TEST_DATABASE`, `ODOO_TEST_EMAIL`, `ODOO_TEST_API_KEY`  
Optional: `ODOO_TEST_COMPANY_ID`

## Security

See [SECURITY.md](./SECURITY.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Code of Conduct

See [CODE_OF_CONDUCT.MD](./CODE_OF_CONDUCT.MD).

## License

MIT. See [LICENSE](./LICENSE).
