import type { OdooVersion } from "./common";

export type LogicalComparator = "&" | "|" | "!";
export type OrderBy =
	| string
	| [string, "asc" | "desc"]
	| Array<[string, "asc" | "desc"]>;

export type LogicalOperatorBase =
	| "="
	| "!="
	| ">"
	| ">="
	| "<"
	| "<="
	| "=?"
	| "=like"
	| "like"
	| "not like"
	| "ilike"
	| "not ilike"
	| "=ilike"
	| "in"
	| "not in"
	| "child_of"
	| "parent_of"
	| "any"
	| "not any";

export type LogicalOperator19 =
	| LogicalOperatorBase
	| "not =like"
	| "not =ilike"
	| "any!"
	| "not any!";

export type LogicalOperator18 = LogicalOperatorBase;
export type LogicalOperator17 = LogicalOperatorBase;
export type LogicalOperator16 = Exclude<LogicalOperatorBase, "any" | "not any">;

type OperatorsByVersion = {
	"16.0": LogicalOperator16;
	"17.0": LogicalOperator17;
	"18.0": LogicalOperator18;
	"19.0": LogicalOperator19;
};

export type LogicalOperatorByVersion<V extends OdooVersion = "19.0"> =
	OperatorsByVersion[V];

export type OdooCondition<V extends OdooVersion = "19.0"> =
	| [string, LogicalOperatorByVersion<V>, unknown]
	| LogicalComparator;

export type OdooDomain<V extends OdooVersion = "19.0"> = OdooCondition<V>[];
