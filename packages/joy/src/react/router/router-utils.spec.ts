import { normalizeConventionRoute, normalizeConventionRouteV6 } from "./router-utils";

describe("react.route-utils", () => {
  test("normalizeConventionRoute", async () => {
    expect(normalizeConventionRoute("/[a]")).toBe("/:a");
    expect(normalizeConventionRoute("/[a$]")).toBe("/:a?");
    expect(normalizeConventionRoute("/[...a]")).toBe("/:a+");
    expect(normalizeConventionRoute("/[...a$]")).toBe("/:a*");

    expect(normalizeConventionRoute("/[a]/[b]")).toBe("/:a/:b");
    expect(normalizeConventionRoute("/[a]/[...b]")).toBe("/:a/:b+");
    expect(normalizeConventionRoute("/[a]/[...b$]")).toBe("/:a/:b*");

    expect(normalizeConventionRoute("/[a]/c/")).toBe("/:a/c");
  });

  test("normalizeConventionRouteV6", async () => {
    expect(normalizeConventionRouteV6("/[a]")).toMatchObject({ path: "/:a" });
    // expect(normalizeConventionRouteV6("/[a$]")).toMatchObject({ path: "/:a?" });
    expect(normalizeConventionRouteV6("/[...a]")).toMatchObject({ path: "/*", catchAllParam: "a" });

    expect(normalizeConventionRouteV6("/[a]/[b]")).toMatchObject({ path: "/:a/:b" });
    expect(normalizeConventionRouteV6("/[a]/[...b]")).toMatchObject({ path: "/:a/*", catchAllParam: "b" });
    // expect(normalizeConventionRouteV6("/[a]/[...b$]")).toMatchObject({ path: "/:a/:b*" });

    expect(normalizeConventionRouteV6("/[a]/c/")).toMatchObject({ path: "/:a/c" });
  });
});
