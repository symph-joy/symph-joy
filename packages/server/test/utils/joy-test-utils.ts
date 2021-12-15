import querystring from "querystring";
import getPort from "get-port";

export async function findPort(): Promise<number> {
  return getPort();
  // return 5000;
}

export function getUrl(port: number, path: string, query?: string | Record<string, any>) {
  let strQurey = (typeof query === "object" ? querystring.stringify(query) : query) || "";
  strQurey = strQurey && strQurey[0] !== "?" ? `?${strQurey}` : strQurey;
  return `http://localhost:${port}${path}${strQurey}`;
}

export async function waitForMoment(millisecond = 100000000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millisecond));
}
