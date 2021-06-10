import { Inject } from "@symph/core";
import { Model, ReactModel } from "@symph/react";

class ZhiHuArticle {
  news_id: string;
  title: string;
  url: string;
  thumbnail: string;
}

@Model()
export class ZhiHuModel extends ReactModel<{
  count: number;
  recent?: ZhiHuArticle[];
}> {
  // @Inject()
  // private apiService: ApiService;

  getInitState() {
    return { zhiHuRecent: undefined, count: 0 };
  }

  async getRecent() {
    this.setState({
      recent: undefined,
    });
    // const data = await this.apiService.fetch("/news/hot");
    const data = { recent: [] };
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.setState({
      recent: data.recent,
    });
  }
}
