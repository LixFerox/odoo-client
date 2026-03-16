import { describe, expect, test } from "bun:test";

import { OdooClient } from "../src/base";

const env = {
	baseUrl: process.env.ODOO_TEST_BASE_URL,
	database: process.env.ODOO_TEST_DATABASE,
	email: process.env.ODOO_TEST_EMAIL,
	apiKey: process.env.ODOO_TEST_API_KEY,
	companyId: process.env.ODOO_TEST_COMPANY_ID,
};

const requiredEnv = [
	"ODOO_TEST_BASE_URL",
	"ODOO_TEST_DATABASE",
	"ODOO_TEST_EMAIL",
	"ODOO_TEST_API_KEY",
] as const;

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missingEnv.length > 0;

describe.skipIf(shouldSkip)("OdooClient integration", () => {
	test("authenticates and runs searchCount against a real Odoo instance", async () => {
		const companyId = env.companyId ? Number(env.companyId) : undefined;
		if (typeof companyId === "number" && Number.isNaN(companyId)) {
			throw new Error("ODOO_TEST_COMPANY_ID must be a valid number");
		}

		const client = new OdooClient({
			baseUrl: env.baseUrl as string,
			database: env.database as string,
			email: env.email as string,
			apiKey: env.apiKey as string,
			companyId,
		});

		const count = await client.searchCount({
			model: "res.partner",
			limit: 1,
		});

		expect(typeof count).toBe("number");
		expect(count).toBeGreaterThanOrEqual(0);
	});
});
