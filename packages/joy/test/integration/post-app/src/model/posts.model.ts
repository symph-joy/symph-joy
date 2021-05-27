import { Model, ReactModel } from "@symph/react";

interface Post {
  id: number;
  title: string;
}

interface PostsModelState {
  isListLoading: boolean;
  entities: Post[];
  total: number;
  pageSize: number;
  pageIndex: number;

  isCurEntityLoading: boolean;
  curEntity?: Post;
}

@Model()
export class PostsModel extends ReactModel<PostsModelState> {
  getInitState(): PostsModelState {
    return {
      isListLoading: false,
      entities: [],
      total: 0,
      pageSize: 10,
      pageIndex: 1,

      isCurEntityLoading: true,
      curEntity: undefined,
    };
  }

  async fetchEntities(): Promise<void> {
    this.setState({
      isListLoading: true,
    });
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.setState({
          isListLoading: false,
          entities: [
            {
              id: 1,
              title: "post-1",
            },
            {
              id: 2,
              title: "post-2",
            },
          ],
          total: 0,
          pageSize: 10,
          pageIndex: 1,
        });
        resolve();
      }, 100);
    });
  }

  async fetchEntity(id: number): Promise<Post> {
    this.setState({
      isCurEntityLoading: true,
    });
    return new Promise<Post>((resolve) => {
      setTimeout(() => {
        const showEntity = {
          id: id,
          title: "post-" + id,
        };
        this.setState({
          isCurEntityLoading: false,
          curEntity: showEntity,
        });
        resolve(showEntity);
      }, 100);
    });
  }
}
