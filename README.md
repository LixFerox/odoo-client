# odoo-client

TypeScript SDK for Odoo XML-RPC (`/xmlrpc/2/common` and `/xmlrpc/2/object`).

## Features

- Authentication with `authenticate`
- Generic model operations:
  - `create`
  - `copy`
  - `write`
  - `read`
  - `search`
  - `searchCount`
  - `unlink`
- Optional single-company context injection (`companyId`)
- Typed domains and operations for Odoo 16-19

## Installation

```bash
bun add odoo-client
```

For local development:

```bash
bun install
```

## Quick Start

```ts
import { OdooClient } from "odoo-client";

const client = new OdooClient({
	baseUrl: "https://your-odoo-instance.com",
	database: "your_db",
	email: "api-user@example.com",
	apiKey: "your_api_key_or_password",
	companyId: 1,
});

const partners = await client.search({
	model: "res.partner",
	domain: [["is_company", "=", true]],
	limit: 10,
	order: "name asc",
});

console.log(partners);
```

## API

### Constructor

```ts
new OdooClient({
	baseUrl: string,
	database: string,
	email: string,
	apiKey: string,
	version?: "16.0" | "17.0" | "18.0" | "19.0",
	companyId?: number,
})
```

### Methods

- `create(args)`
- `copy(args)`
- `write(args)`
- `read(args)`
- `search(args)`
- `searchCount(args)`
- `unlink(args)`

See [EXAMPLES.md](./EXAMPLES.md) for complete examples.

## Development

```bash
bun run typecheck
bun run check
bun run build
```

## Security

See [SECURITY.md](./SECURITY.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT. See [LICENSE](./LICENSE).
