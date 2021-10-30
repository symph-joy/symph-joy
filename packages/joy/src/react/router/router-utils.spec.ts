import { normalizeConventionRoute } from "./router-utils";

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
});
