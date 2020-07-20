/* eslint-disable @typescript-eslint/no-explicit-any */
export type RouteDefinition<Match, ActionResult> = {
  readonly action: (match: Match) => ActionResult;
};

export type ActionType<ActionResult, Match> = RouteDefinition<
  Match,
  ActionResult
>["action"];

/**
 * Get Match type of given RouteDefinition.
 */
export type MatchOfRouteDefinition<RD> = RD extends RouteDefinition<
  infer Match,
  any
>
  ? unknown extends Match
    ? {}
    : Match
  : {};

export type RoutesDefinition<ActionResult> = Record<
  string,
  RouteDefinition<any, ActionResult>
>;
