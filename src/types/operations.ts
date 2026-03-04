import type { OdooContext, OdooVersion } from "./common";
import type { OdooDomain, OrderBy } from "./domain";

export type Create<
	T extends Record<string, unknown> = Record<string, unknown>,
> = {
	model: string;
	values: Partial<T> | Array<Partial<T>>;
	context?: OdooContext;
};

export type Write<T extends Record<string, unknown> = Record<string, unknown>> =
	{
		model: string;
		ids: number[];
		values: Partial<T>;
		context?: OdooContext;
	};

export type Read<F extends string = string> = {
	model: string;
	ids: number[];
	fields?: F[];
	context?: OdooContext;
};

export type Search<V extends OdooVersion = "19.0"> = {
	model: string;
	domain?: OdooDomain<V>;
	offset?: number;
	limit?: number;
	order?: OrderBy;
	context?: OdooContext;
};

export type SearchCount<V extends OdooVersion = "19.0"> = {
	model: string;
	domain?: OdooDomain<V>;
	limit?: number;
	context?: OdooContext;
};

export type Unlink = {
	model: string;
	ids: number[];
	context?: OdooContext;
};

export type Copy<T extends Record<string, unknown> = Record<string, unknown>> =
	{
		model: string;
		id: number;
		defaults?: Partial<T>;
		context?: OdooContext;
	};
