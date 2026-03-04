# Examples

## 1. Create client

```ts
import { OdooClient } from "odoo-client";

const client = new OdooClient({
	baseUrl: "https://your-odoo-instance.com",
	database: "your_db",
	email: "api-user@example.com",
	apiKey: "your_api_key_or_password",
	companyId: 1,
});
```

## 2. Search and read partner IDs

```ts
const ids = await client.search({
	model: "res.partner",
	domain: [["is_company", "=", true]],
	limit: 20,
	order: "name asc",
});

console.log(ids);
```

## 3. Search count

```ts
const count = await client.searchCount({
	model: "res.partner",
	domain: [["customer_rank", ">", 0]],
});

console.log("Customers:", count);
```

## 4. Read records

```ts
const records = await client.read({
	model: "res.partner",
	ids: [1, 2, 3],
	fields: ["name", "email", "phone"],
});

console.log(records);
```

## 5. Create record

```ts
const id = await client.create({
	model: "res.partner",
	values: {
		name: "ACME Corp",
		email: "sales@acme.example",
	},
});

console.log("Created partner ID:", id);
```

## 6. Update (write)

```ts
const ok = await client.write({
	model: "res.partner",
	ids: [42],
	values: {
		phone: "+34 600 000 000",
	},
});

console.log("Updated:", ok);
```

## 7. Duplicate (copy)

```ts
const newId = await client.copy({
	model: "res.partner",
	id: 42,
	defaults: {
		name: "ACME Corp (Copy)",
	},
});

console.log("Copy ID:", newId);
```

## 8. Delete (unlink)

```ts
const removed = await client.unlink({
	model: "res.partner",
	ids: [99],
});

console.log("Deleted:", removed);
```

## 9. Per-request context override

```ts
const ids = await client.search({
	model: "res.partner",
	domain: [["name", "ilike", "odoo"]],
	context: {
		lang: "es_ES",
		tz: "Europe/Madrid",
	},
});
```

## 10. Domain with logical operators

```ts
const ids = await client.search({
	model: "res.partner",
	domain: [
		"&",
		["is_company", "=", true],
		"|",
		["customer_rank", ">", 0],
		["supplier_rank", ">", 0],
	],
});
```
