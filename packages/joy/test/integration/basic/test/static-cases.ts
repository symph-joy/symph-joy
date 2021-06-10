import { JoyTestContext } from "../../../util/joy-test-context";
import { fetchViaHTTP } from "../../../util/joy-test-utils";

export function staticCases(testContext: JoyTestContext) {
  describe("static files", () => {
    test("should return static file, /static/hello.txt", async () => {
      const res = await fetchViaHTTP(testContext.port, "/static/hello.txt");
      expect(res.status).toBe(200);
      const content = await res.text();
      expect(content.trim()).toBe("Hello world!");
    });
  });
}
