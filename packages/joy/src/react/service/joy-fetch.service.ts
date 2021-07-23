import { RuntimeException } from "@symph/core";

export class JoyFetchService {
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    if (typeof window === "undefined" || typeof window.fetch === "undefined") {
      throw new RuntimeException(
        "Current runtime version did not support global fetch method。"
      );
    }
    return window.fetch(input, init);
  }
}
