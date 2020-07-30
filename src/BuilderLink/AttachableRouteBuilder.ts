import type { BuilderLink } from ".";
import { RouteResolver } from "../RouteResolver";

export interface HasBuilderLink<ActionResult, Segment> {
  getBuilderLink(): BuilderLink<ActionResult, Segment>;
}

export interface AttachableRouteBuilder<ActionResult, Segment>
  extends HasBuilderLink<ActionResult, Segment> {
  getResolver(): RouteResolver<ActionResult, Segment>;
}