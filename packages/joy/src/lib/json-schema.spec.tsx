import { MinLength, getJsonSchema } from "./json-schema";

describe("json-schema", () => {
  test("should get json schema from ts class", async () => {
    class HelloClass {
      @MinLength(3)
      msg: string;
    }
    const schema = getJsonSchema(HelloClass);
    console.log(schema);
    expect(schema.type).toBe("object");
    expect(schema.properties.msg.minLength).toBe(3);
  });
});
