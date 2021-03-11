import * as tapable from "tapable";

export interface ITap {
  id: string;
  stage?: number;
  before?: string | string[];
  provider: Object;
  propKey: string;
  // providerId: string,
  // propKey: string,
}
