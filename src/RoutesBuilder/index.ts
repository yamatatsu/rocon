import type { LocationComposer } from "../LocationComposer";
import type { Location } from "../LocationComposer/Location";
import type { RouteRecordConfig, RouteRecordType } from "../RouteRecord";
import { RouteResolver, SegmentResolver } from "../RouteResolver";
import { assertNever } from "../util/assert";
import { PartiallyPartial } from "../util/types/PartiallyPartial";
import { AttachableRoutesBuilder } from "./AttachableRoutesBuilder";
import { fillOptions } from "./fillOptions";
import type { RoutesBuilderOptions } from "./RoutesBuilderOptions";

export type RouteRecordsBase<ActionResult> = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RouteRecordType<ActionResult, any, any>
>;

declare const wildcardCovariance: unique symbol;

/**
 * State of RoutesBuilder.
 * - unattached: this builder is not attached to a parent.
 * - attached: this builder is attached to a parent.
 * - invalidated: this builder is invalidated.
 */
type RoutesBuilderState = "unattached" | "attached" | "invalidated";

/**
 * Abstract Builder to define routes.
 */
export class RoutesBuilder<ActionResult> {
  static init<ActionResult>(
    options: PartiallyPartial<
      RoutesBuilderOptions<ActionResult, string>,
      "root"
    >
  ): RoutesBuilder<ActionResult> {
    fillOptions(options);
    return new RoutesBuilder<ActionResult>(options);
  }

  #state: RoutesBuilderState = "unattached";
  #registeredBuilder?: AttachableRoutesBuilder<ActionResult> = undefined;
  #composer: LocationComposer<string>;
  #rootLocation: Location;
  #routeRecordConfig: RouteRecordConfig;
  #parentRoute?: RouteRecordType<ActionResult, never, boolean> = undefined;

  private constructor(options: RoutesBuilderOptions<ActionResult, string>) {
    this.#composer = options.composer;
    this.#rootLocation = options.root;
    this.#routeRecordConfig = {
      composer: options.composer,
      getRootLocation: (match) => {
        if (this.#parentRoute !== undefined) {
          return this.#parentRoute.getLocation(match as never);
        }
        return this.#rootLocation;
      },
      attachBuilderToRoute: (builder, route) => {
        // TODO: recover this check
        // if (builder.#state !== "unattached") {
        //   throw new Error("A builder cannot be attached more than once.");
        // }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        builder.#parentRoute = route as RouteRecordType<any, any, never>;
        builder.#state = "attached";
      },
    };
  }

  checkInvalidation() {
    if (this.#state === "invalidated") {
      throw new Error("This RoutesBuilder is already invalidated.");
    }
  }

  /**
   * TODO: wanna make this private
   */
  getRouteRecordConfig(): RouteRecordConfig {
    return this.#routeRecordConfig;
  }

  /**
   * TODO: wanna deprecate in favor of inherit
   */
  clone(): RoutesBuilder<ActionResult> {
    const result = new RoutesBuilder<ActionResult>({
      composer: this.#composer,
      root: this.#rootLocation,
    });
    result.#state = this.#state;
    result.#parentRoute = this.#parentRoute;
    result.#registeredBuilder = this.#registeredBuilder;
    return result;
  }

  /**
   * TODO: rethink
   */
  register(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder: AttachableRoutesBuilder<ActionResult>
  ): void {
    this.#registeredBuilder = builder;
  }

  /**
   * Inherit internal information to a builder generated from this.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inheritTo(target: RoutesBuilder<ActionResult>): void {
    target.#parentRoute = this.#parentRoute;
    switch (this.#state) {
      case "unattached": {
        break;
      }
      case "attached": {
        // inherit attachedness to child
        this.#state = "invalidated";
        if (target.#registeredBuilder !== undefined) {
          // this.#parentRoute should always exist here but we use ?. here for ease
          this.#parentRoute?.attach(target.#registeredBuilder);
        }
        break;
      }
      case "invalidated": {
        this.checkInvalidation();
        break;
      }
      default: {
        assertNever(this.#state);
      }
    }
  }

  getResolver(
    resolveSegment: SegmentResolver<ActionResult, string>
  ): RouteResolver<ActionResult, string> {
    this.checkInvalidation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new RouteResolver(this.#composer, resolveSegment);
  }
}
