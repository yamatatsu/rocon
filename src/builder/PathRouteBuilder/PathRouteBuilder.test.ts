import { PathRouteBuilder } from ".";
import { getRouteRecordLocation } from "../RouteRecord/getRouteRecordLocation";
import { wildcardRouteKey } from "../symbols";

describe("PathRouteBuilder", () => {
  describe("routes", () => {
    it("Empty at init", () => {
      const b = PathRouteBuilder.init();
      expect(b.getRoutes()).toEqual({});
    });

    it("Reflects one routes() call", () => {
      const res = PathRouteBuilder.init<string>().routes({
        foo: {
          action: () => "foo!",
        },
        bar: {
          action: () => "bar?",
        },
      });
      const routes = res.getRoutes();
      expect(Object.keys(routes)).toEqual(["foo", "bar"]);
      expect(routes.foo.action({})).toEqual("foo!");
      expect(getRouteRecordLocation(routes.foo, {})).toEqual({
        pathname: "/foo",
        state: null,
      });
      expect(routes.bar.action({})).toEqual("bar?");
      expect(getRouteRecordLocation(routes.bar, {})).toEqual({
        pathname: "/bar",
        state: null,
      });
    });

    it("Reflects two routes() calls", () => {
      const res = PathRouteBuilder.init<string>()
        .routes({
          foo: {
            action: () => "foo!",
          },
        })
        .routes({
          bar: {
            action: () => "bar?",
          },
        });
      const routes = res.getRoutes();
      expect(Object.keys(routes)).toEqual(["foo", "bar"]);
      expect(routes.foo.action({})).toEqual("foo!");
      expect(getRouteRecordLocation(routes.foo, {})).toEqual({
        pathname: "/foo",
        state: null,
      });
      expect(routes.bar.action({})).toEqual("bar?");
      expect(getRouteRecordLocation(routes.bar, {})).toEqual({
        pathname: "/bar",
        state: null,
      });
    });

    it("PathRouteBuilder is immutable", () => {
      const b1 = PathRouteBuilder.init<string>().routes({
        foo: {
          action: () => "foo!",
        },
      });
      const b2 = b1.routes({
        bar: {
          action: () => "bar?",
        },
      });
      const routes1 = b1.getRoutes();
      expect(Object.keys(routes1)).toEqual(["foo"]);
      const routes2 = b2.getRoutes();
      expect(Object.keys(routes2)).toEqual(["foo", "bar"]);
    });
  });
  describe("route", () => {
    it("just add one route", () => {
      const b = PathRouteBuilder.init();
      const res = b.route("foo");

      const routes = res.getRoutes();
      expect(Object.keys(routes)).toEqual(["foo"]);
      expect(routes.foo.action).toBeUndefined();
    });
    it("add route and set action", () => {
      const b = PathRouteBuilder.init();
      const res = b.route("foo", (foo) => foo.action(() => "I am foo"));

      const routes = res.getRoutes();
      expect(routes.foo.action?.({})).toBe("I am foo");
    });
    it("add multipe routes one by one", () => {
      const b = PathRouteBuilder.init();
      const res = b
        .route("foo", (foo) => foo.action(() => "I am foo"))
        .route("bar", (bar) => bar.action(() => "Hello, bar"));

      const routes = res.getRoutes();
      expect(routes.foo.action?.({})).toBe("I am foo");
      expect(routes.bar.action?.({})).toBe("Hello, bar");
    });
    it("attach in route", () => {
      const sub = PathRouteBuilder.init().route("abc", (abc) =>
        abc.action(() => "abcdefg")
      );
      const toplevel = PathRouteBuilder.init();
      toplevel.route("foo", (foo) => foo.attach(sub));

      expect(getRouteRecordLocation(sub.getRoutes().abc, {})).toEqual({
        pathname: "/foo/abc",
        state: null,
      });
    });
  });

  describe("attach", () => {
    it("composed location action", () => {
      const toplevel = PathRouteBuilder.init<string>()
        .routes({
          foo: {
            action: () => "foo!",
          },
        })
        .getRoutes();
      const sub = toplevel.foo
        .attach(PathRouteBuilder.init<string>())
        .routes({
          bar: {
            action: () => "bar!",
          },
        })
        .getRoutes();

      expect(sub.bar.action({})).toBe("bar!");
    });
    it("composed location object", () => {
      const toplevel = PathRouteBuilder.init<string>()
        .routes({
          foo: {
            action: () => "foo!",
          },
        })
        .getRoutes();
      const sub = toplevel.foo
        .attach(PathRouteBuilder.init<string>())
        .routes({
          bar: {
            action: () => "bar!",
          },
        })
        .getRoutes();

      expect(getRouteRecordLocation(sub.bar, {})).toEqual({
        pathname: "/foo/bar",
        state: null,
      });
    });
    it("change location after attach", () => {
      const sub = PathRouteBuilder.init<string>().routes({
        bom: {
          action: () => "bom!",
        },
      });
      const subRoutes = sub.getRoutes();
      expect(getRouteRecordLocation(subRoutes.bom, {})).toEqual({
        pathname: "/bom",
        state: null,
      });

      const toplevel = PathRouteBuilder.init<string>()
        .routes({
          foo: {
            action: () => "foo!",
          },
        })
        .getRoutes();
      toplevel.foo.attach(sub);
      expect(getRouteRecordLocation(subRoutes.bom, {})).toEqual({
        pathname: "/foo/bom",
        state: null,
      });
    });
  });

  describe("any route", () => {
    it("any works like wildcard", () => {
      const res = PathRouteBuilder.init<string>().any("id", {
        action: ({ id }) => `id is ${id.slice(0, 8)}`,
      });
      const routes = res.getRoutes();
      expect(routes[wildcardRouteKey].route.action({ id: "wow" })).toEqual(
        "id is wow"
      );
    });
    it("sub route of any", () => {
      const res = PathRouteBuilder.init<string>().any("id", {
        action: ({ id }) => `id is ${id.slice(0, 8)}`,
      });
      const routes = res.getRoutes();
      const subRoutes = PathRouteBuilder.attachTo(
        routes[wildcardRouteKey].route
      )
        .routes({
          hoge: {
            action: () => "sub",
          },
        })
        .getRoutes();

      expect(getRouteRecordLocation(subRoutes.hoge, { id: "wow" })).toEqual({
        pathname: "/wow/hoge",
        state: null,
      });
    });
  });
});