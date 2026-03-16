import { describe, expect, it } from "bun:test";
import { createClient, createSecureClient } from "xmlrpc";

import { OdooClient } from "../src/base";

type XmlRpcCallRecord = {
	client: unknown;
	method: string;
	params: unknown[];
};

type ClientInternals = {
	getCommonClient: () => unknown;
	getObjectClient: () => unknown;
	xmlrpcCall: <T>(
		client: unknown,
		method: string,
		params: unknown[],
	) => Promise<T>;
};

type HarnessOptions = {
	authResult?: number | false;
	companyId?: number;
	executeResults?: unknown[];
	authError?: Error;
	executeError?: Error;
	executeErrorAt?: number;
};

function createHarness(options: HarnessOptions = {}) {
	const {
		authResult = 99,
		companyId,
		executeResults = [],
		authError,
		executeError,
		executeErrorAt,
	} = options;
	const client = new OdooClient({
		apiKey: "token",
		baseUrl: "https://odoo.example.com/",
		database: "db",
		email: "user@example.com",
		companyId,
	});
	const clientInternals = client as unknown as ClientInternals;

	const commonClient = { endpoint: "common" };
	const objectClient = { endpoint: "object" };
	const calls: XmlRpcCallRecord[] = [];
	let executeIndex = 0;

	clientInternals.getCommonClient = () => commonClient;
	clientInternals.getObjectClient = () => objectClient;
	clientInternals.xmlrpcCall = async <T>(
		rpcClient: unknown,
		method: string,
		params: unknown[],
	) => {
		calls.push({ client: rpcClient, method, params });

		if (method === "authenticate") {
			if (authError) {
				throw authError;
			}
			return authResult as T;
		}
		if (method === "execute_kw") {
			if (executeErrorAt === executeIndex) {
				executeIndex += 1;
				throw executeError ?? new Error("execute_kw call failed");
			}
			const next = executeResults[executeIndex];
			executeIndex += 1;
			return next as T;
		}

		throw new Error(`Unexpected XML-RPC method: ${method}`);
	};

	return { client, commonClient, objectClient, calls };
}

function executeCalls(calls: XmlRpcCallRecord[]) {
	return calls.filter((call) => call.method === "execute_kw");
}

describe("OdooClient", () => {
	it("authenticates once and reuses the uid across requests", async () => {
		const { client, commonClient, objectClient, calls } = createHarness({
			authResult: 321,
			executeResults: [[1, 2], [{ id: 1 }]],
		});

		await client.search({ model: "res.partner" });
		await client.read({ model: "res.partner", ids: [1] });

		const authCalls = calls.filter((call) => call.method === "authenticate");
		expect(authCalls).toHaveLength(1);
		expect(authCalls[0]).toEqual({
			client: commonClient,
			method: "authenticate",
			params: ["db", "user@example.com", "token", {}],
		});

		const rpcExecuteCalls = executeCalls(calls);
		expect(rpcExecuteCalls).toHaveLength(2);
		expect(rpcExecuteCalls[0]?.client).toBe(objectClient);
		expect(rpcExecuteCalls[1]?.client).toBe(objectClient);
		expect(rpcExecuteCalls[0]?.params[1]).toBe(321);
		expect(rpcExecuteCalls[1]?.params[1]).toBe(321);
	});

	it("throws when authentication fails", async () => {
		const { client, calls } = createHarness({ authResult: false });

		await expect(
			client.search({
				model: "res.partner",
			}),
		).rejects.toThrow("Authentication failed: Invalid credentials");

		expect(executeCalls(calls)).toHaveLength(0);
	});

	it("propagates XML-RPC errors thrown during authentication", async () => {
		const authError = new Error("network down");
		const { client, calls } = createHarness({ authError });

		await expect(client.search({ model: "res.partner" })).rejects.toBe(
			authError,
		);
		expect(executeCalls(calls)).toHaveLength(0);
	});

	it("propagates XML-RPC errors thrown during execute_kw", async () => {
		const executeError = new Error("odoo timeout");
		const { client, calls } = createHarness({
			executeError,
			executeErrorAt: 0,
		});

		await expect(
			client.search({
				model: "res.partner",
			}),
		).rejects.toBe(executeError);

		const authCalls = calls.filter((call) => call.method === "authenticate");
		expect(authCalls).toHaveLength(1);
		expect(executeCalls(calls)).toHaveLength(1);
	});

	it("injects company context for requests when companyId is configured", async () => {
		const { client, calls } = createHarness({
			companyId: 7,
			executeResults: [true],
		});

		await client.write({
			model: "res.partner",
			ids: [1],
			values: { name: "ACME" },
		});

		const call = executeCalls(calls)[0];
		expect(call?.params[6]).toEqual({
			context: {
				allowed_company_ids: [7],
				company_id: 7,
			},
		});
	});

	it("injects company context even when companyId is 0", async () => {
		const { client, calls } = createHarness({
			companyId: 0,
			executeResults: [true],
		});

		await client.write({
			model: "res.partner",
			ids: [1],
			values: { name: "ACME" },
		});

		const call = executeCalls(calls)[0];
		expect(call?.params[6]).toEqual({
			context: {
				allowed_company_ids: [0],
				company_id: 0,
			},
		});
	});

	it("merges custom context with company context", async () => {
		const { client, calls } = createHarness({
			companyId: 7,
			executeResults: [11],
		});

		await client.searchCount({
			model: "res.partner",
			limit: 50,
			context: { lang: "es_ES" },
		});

		const call = executeCalls(calls)[0];
		expect(call?.params[6]).toEqual({
			limit: 50,
			context: {
				allowed_company_ids: [7],
				company_id: 7,
				lang: "es_ES",
			},
		});
	});

	it("lets explicit context company keys override auto company context", async () => {
		const { client, calls } = createHarness({
			companyId: 7,
			executeResults: [11],
		});

		await client.searchCount({
			model: "res.partner",
			context: {
				company_id: 9,
				allowed_company_ids: [9, 10],
				lang: "en_US",
			},
		});

		const call = executeCalls(calls)[0];
		expect(call?.params[6]).toEqual({
			context: {
				allowed_company_ids: [9, 10],
				company_id: 9,
				lang: "en_US",
			},
		});
	});

	it("serializes search order from tuple and array notation", async () => {
		const { client, calls } = createHarness({
			executeResults: [[1], [2], [3]],
		});

		await client.search({
			model: "res.partner",
			order: ["name", "asc"],
		});
		await client.search({
			model: "res.partner",
			order: [
				["name", "asc"],
				["id", "desc"],
			],
		});
		await client.search({
			model: "res.partner",
			order: "name desc",
			offset: 10,
			limit: 5,
		});

		const [tupleOrder, arrayOrder, stringOrder] = executeCalls(calls);

		expect(tupleOrder?.params[5]).toEqual([[]]);
		expect(tupleOrder?.params[6]).toEqual({ order: "name asc" });

		expect(arrayOrder?.params[6]).toEqual({ order: "name asc, id desc" });

		expect(stringOrder?.params[6]).toEqual({
			offset: 10,
			limit: 5,
			order: "name desc",
		});
	});

	it("uses default empty domain when omitted and forwards explicit domains", async () => {
		const partnerDomain: [string, "=", boolean][] = [["is_company", "=", true]];
		const saleDomain: [string, "=", string][] = [["state", "=", "sale"]];
		const { client, calls } = createHarness({
			executeResults: [[1], [2], 10, 11],
		});

		await client.search({
			model: "res.partner",
		});
		await client.search({
			model: "res.partner",
			domain: partnerDomain,
		});
		await client.searchCount({
			model: "sale.order",
		});
		await client.searchCount({
			model: "sale.order",
			domain: saleDomain,
		});

		const [searchDefault, searchDomain, countDefault, countDomain] =
			executeCalls(calls);

		expect(searchDefault?.params[5]).toEqual([[]]);
		expect(searchDomain?.params[5]).toEqual([partnerDomain]);
		expect(countDefault?.params[5]).toEqual([[]]);
		expect(countDomain?.params[5]).toEqual([saleDomain]);
	});

	it("omits empty read fields and includes non-empty fields", async () => {
		const { client, calls } = createHarness({
			executeResults: [[], []],
		});

		await client.read({
			model: "res.partner",
			ids: [1],
			fields: [],
		});

		await client.read({
			model: "res.partner",
			ids: [1],
			fields: ["name"],
			context: { tz: "UTC" },
		});

		const [withoutFields, withFields] = executeCalls(calls);

		expect(withoutFields?.params[6]).toEqual({});
		expect(withFields?.params[6]).toEqual({
			fields: ["name"],
			context: { tz: "UTC" },
		});
	});

	it("uses default copy values, forwards custom defaults and create payload", async () => {
		const { client, calls } = createHarness({
			executeResults: [10, 11, 12],
		});

		await client.create({
			model: "res.partner",
			values: { name: "Partner" },
		});
		await client.copy({
			model: "res.partner",
			id: 10,
		});
		await client.copy({
			model: "res.partner",
			id: 11,
			defaults: { name: "Partner (copy)" },
			context: { lang: "es_ES" },
		});

		const [createCall, copyCallDefault, copyCallCustom] = executeCalls(calls);

		expect(createCall?.params[4]).toBe("create");
		expect(createCall?.params[5]).toEqual([{ name: "Partner" }]);

		expect(copyCallDefault?.params[4]).toBe("copy");
		expect(copyCallDefault?.params[5]).toEqual([10, {}]);
		expect(copyCallDefault?.params[6]).toEqual({});

		expect(copyCallCustom?.params[4]).toBe("copy");
		expect(copyCallCustom?.params[5]).toEqual([11, { name: "Partner (copy)" }]);
		expect(copyCallCustom?.params[6]).toEqual({
			context: { lang: "es_ES" },
		});
	});

	it("forwards context for write and unlink operations", async () => {
		const { client, calls } = createHarness({
			executeResults: [true, true],
		});

		await client.write({
			model: "res.partner",
			ids: [1, 2],
			values: { email: "x@example.com" },
			context: { tz: "UTC" },
		});
		await client.unlink({
			model: "res.partner",
			ids: [1],
			context: { active_test: false },
		});

		const [writeCall, unlinkCall] = executeCalls(calls);

		expect(writeCall?.params[4]).toBe("write");
		expect(writeCall?.params[5]).toEqual([[1, 2], { email: "x@example.com" }]);
		expect(writeCall?.params[6]).toEqual({ context: { tz: "UTC" } });

		expect(unlinkCall?.params[4]).toBe("unlink");
		expect(unlinkCall?.params[5]).toEqual([[1]]);
		expect(unlinkCall?.params[6]).toEqual({
			context: { active_test: false },
		});
	});

	it("uses secure or plain XML-RPC factory based on protocol", () => {
		const secureClient = new OdooClient({
			apiKey: "token",
			baseUrl: "https://odoo.example.com/",
			database: "db",
			email: "user@example.com",
		});
		const secureClientInternals = secureClient as unknown as {
			clientFactory: unknown;
		};

		const plainClient = new OdooClient({
			apiKey: "token",
			baseUrl: "http://odoo.example.com/",
			database: "db",
			email: "user@example.com",
		});
		const plainClientInternals = plainClient as unknown as {
			clientFactory: unknown;
		};

		expect(secureClientInternals.clientFactory).toBe(createSecureClient);
		expect(plainClientInternals.clientFactory).toBe(createClient);
	});

	it("normalizes base URL and caches common/object clients", () => {
		type FactoryOptions = {
			url: string;
		};
		type StubClient = {
			url: string;
		};

		const client = new OdooClient({
			apiKey: "token",
			baseUrl: "https://odoo.example.com/",
			database: "db",
			email: "user@example.com",
		});
		const clientInternals = client as unknown as {
			normalizedBaseUrl: string;
			getCommonClient: () => StubClient;
			getObjectClient: () => StubClient;
		};

		const factoryCalls: string[] = [];
		Object.defineProperty(client, "clientFactory", {
			configurable: true,
			get() {
				return (options: FactoryOptions): StubClient => {
					factoryCalls.push(options.url);
					return { url: options.url };
				};
			},
		});

		expect(clientInternals.normalizedBaseUrl).toBe("https://odoo.example.com");

		const commonClientA = clientInternals.getCommonClient();
		const commonClientB = clientInternals.getCommonClient();
		const objectClientA = clientInternals.getObjectClient();
		const objectClientB = clientInternals.getObjectClient();

		expect(commonClientA).toBe(commonClientB);
		expect(objectClientA).toBe(objectClientB);
		expect(factoryCalls).toEqual([
			"https://odoo.example.com/xmlrpc/2/common",
			"https://odoo.example.com/xmlrpc/2/object",
		]);
	});
});
