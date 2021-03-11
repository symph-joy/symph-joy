import unfetch from "unfetch";
import { Inject, Injectable } from "@symph/core";

type ResponseType =
  | "arraybuffer"
  | "blob"
  | "document"
  | "json"
  | "text"
  | "stream";

interface ApiServiceOptions {
  baseURL: string;
  responseType: ResponseType;
}

@Injectable({ autoReg: true })
export class ApiService {
  public baseURL = "http://10.222.16.82:8110/mock/145/manage";

  public responseType: ResponseType = "json";

  // constructor({baseURL, responseType}: ApiServiceOptions) {
  //   this.baseURL = baseURL
  //   this.responseType = responseType
  // }

  public getRequestURL(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return this.baseURL + path;
  }

  public async fetch<T = any>(
    request: RequestInfo,
    init?: RequestInit
  ): Promise<T> {
    let sendRequest = request;
    if (typeof request === "string") {
      const url = this.getRequestURL(request);
      sendRequest = new Request(url);
    } else {
      const url = this.getRequestURL(request.url);
      sendRequest = new Request({ ...request, url: url });
    }

    // >> 请求拦截器， 发送请求之前做点什么

    let response: any = await unfetch(sendRequest, init);
    if (this.responseType === "json") {
      response = await response.json();
    }
    // >> 响应拦截器， 可以： 处理响应数据，封装通用异常处理结果
    return response;
  }
}
