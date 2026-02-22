/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attachments from '../attachments.js'
import type * as auth from '../auth.js'
import type * as http from '../http.js'
import type * as projects from '../projects.js'
import type * as scenes from '../scenes.js'
import type * as shots from '../shots.js'

import type {ApiFromModules, FilterApi, FunctionReference} from 'convex/server'

declare const fullApi: ApiFromModules<{
  attachments: typeof attachments;
  auth: typeof auth;
  http: typeof http;
  projects: typeof projects;
  scenes: typeof scenes;
  shots: typeof shots;
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
