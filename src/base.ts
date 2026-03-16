import { createClient, createSecureClient } from "xmlrpc";

import type {
	Copy,
	Create,
	OdooContext,
	OdooVersion,
	Read,
	Search,
	SearchCount,
	Unlink,
	Write,
} from "./types";

type Config = {
	apiKey: string;
	baseUrl: string;
	email: string;
	database: string;
	version?: OdooVersion;
	companyId?: number;
};

type XmlRpcClient = ReturnType<typeof createClient>;
type ExecuteKwargs = Record<string, unknown> & { context?: OdooContext };

export class OdooClient {
	private apiKey: string;
	private baseUrl: string;
	private email: string;
	private database: string;
	private companyId?: number;
	private uid?: number;
	private commonClient?: XmlRpcClient;
	private objectClient?: XmlRpcClient;

	constructor(config: Config) {
		this.apiKey = config.apiKey;
		this.baseUrl = config.baseUrl;
		this.email = config.email;
		this.database = config.database;
		this.companyId = config.companyId;
	}

	private get normalizedBaseUrl() {
		return this.baseUrl.endsWith("/")
			? this.baseUrl.slice(0, -1)
			: this.baseUrl;
	}

	private get clientFactory() {
		return this.normalizedBaseUrl.startsWith("https://")
			? createSecureClient
			: createClient;
	}

	private getCommonClient() {
		if (!this.commonClient) {
			this.commonClient = this.clientFactory({
				url: `${this.normalizedBaseUrl}/xmlrpc/2/common`,
			});
		}
		return this.commonClient;
	}

	private getObjectClient() {
		if (!this.objectClient) {
			this.objectClient = this.clientFactory({
				url: `${this.normalizedBaseUrl}/xmlrpc/2/object`,
			});
		}
		return this.objectClient;
	}

	private xmlrpcCall<T>(
		client: XmlRpcClient,
		method: string,
		params: unknown[],
	) {
		return new Promise<T>((resolve, reject) => {
			client.methodCall(method, params, (error, value) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(value as T);
			});
		});
	}

	private buildContext(context?: OdooContext): OdooContext | undefined {
		if (typeof this.companyId !== "number") {
			return context;
		}
		return {
			allowed_company_ids: [this.companyId],
			company_id: this.companyId,
			...(context ?? {}),
		};
	}

	private serializeOrder(order: Search["order"]): string | undefined {
		if (typeof order === "undefined") {
			return undefined;
		}
		if (typeof order === "string") {
			return order;
		}
		if (
			Array.isArray(order) &&
			order.length === 2 &&
			typeof order[0] === "string" &&
			(order[1] === "asc" || order[1] === "desc")
		) {
			return `${order[0]} ${order[1]}`;
		}
		return order
			.map(([field, direction]) => `${field} ${direction}`)
			.join(", ");
	}

	private async authenticate() {
		if (typeof this.uid === "number") {
			return this.uid;
		}
		const uid = await this.xmlrpcCall<number | false>(
			this.getCommonClient(),
			"authenticate",
			[this.database, this.email, this.apiKey, {}],
		);

		if (!uid || typeof uid !== "number") {
			throw new Error("Authentication failed: Invalid credentials");
		}

		this.uid = uid;
		return uid;
	}

	private async executeKw<T>(
		model: string,
		method: string,
		args: unknown[],
		kwargs: ExecuteKwargs = {},
	) {
		const uid = await this.authenticate();
		const builtContext = this.buildContext(kwargs.context);
		const payloadKwargs = builtContext
			? { ...kwargs, context: builtContext }
			: kwargs;

		return this.xmlrpcCall<T>(this.getObjectClient(), "execute_kw", [
			this.database,
			uid,
			this.apiKey,
			model,
			method,
			args,
			payloadKwargs,
		]);
	}

	async create(args: Create) {
		const kwargs: ExecuteKwargs = args.context ? { context: args.context } : {};
		return this.executeKw<number | number[]>(
			args.model,
			"create",
			[args.values],
			kwargs,
		);
	}

	async copy(args: Copy) {
		const kwargs: ExecuteKwargs = args.context ? { context: args.context } : {};
		return this.executeKw<number>(
			args.model,
			"copy",
			[args.id, args.defaults ?? {}],
			kwargs,
		);
	}

	async write(args: Write) {
		const kwargs: ExecuteKwargs = args.context ? { context: args.context } : {};
		return this.executeKw<boolean>(
			args.model,
			"write",
			[args.ids, args.values],
			kwargs,
		);
	}

	async read(args: Read) {
		const kwargs: ExecuteKwargs = {};
		if (args.fields?.length) {
			kwargs.fields = args.fields;
		}
		if (args.context) {
			kwargs.context = args.context;
		}
		return this.executeKw<Record<string, unknown>[]>(
			args.model,
			"read",
			[args.ids],
			kwargs,
		);
	}

	async search(args: Search) {
		const kwargs: ExecuteKwargs = {};
		if (typeof args.offset === "number") {
			kwargs.offset = args.offset;
		}
		if (typeof args.limit === "number") {
			kwargs.limit = args.limit;
		}
		const order = this.serializeOrder(args.order);
		if (order) {
			kwargs.order = order;
		}
		if (args.context) {
			kwargs.context = args.context;
		}
		return this.executeKw<number[]>(
			args.model,
			"search",
			[args.domain ?? []],
			kwargs,
		);
	}

	async searchCount(args: SearchCount) {
		const kwargs: ExecuteKwargs = {};
		if (typeof args.limit === "number") {
			kwargs.limit = args.limit;
		}
		if (args.context) {
			kwargs.context = args.context;
		}
		return this.executeKw<number>(
			args.model,
			"search_count",
			[args.domain ?? []],
			kwargs,
		);
	}

	async unlink(args: Unlink) {
		const kwargs: ExecuteKwargs = args.context ? { context: args.context } : {};
		return this.executeKw<boolean>(args.model, "unlink", [args.ids], kwargs);
	}
}
