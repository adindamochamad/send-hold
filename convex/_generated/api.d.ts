/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cachedQloo from "../cachedQloo.js";
import type * as folioActions from "../folioActions.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as plans from "../plans.js";
import type * as productHelpers from "../productHelpers.js";
import type * as productMutations from "../productMutations.js";
import type * as qlooCache from "../qlooCache.js";
import type * as qlooEnv from "../qlooEnv.js";
import type * as rateLimit from "../rateLimit.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cachedQloo: typeof cachedQloo;
  folioActions: typeof folioActions;
  health: typeof health;
  http: typeof http;
  plans: typeof plans;
  productHelpers: typeof productHelpers;
  productMutations: typeof productMutations;
  qlooCache: typeof qlooCache;
  qlooEnv: typeof qlooEnv;
  rateLimit: typeof rateLimit;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
