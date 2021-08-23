import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";
import { Autowire } from "@symph/core";
import { Prerender } from "@symph/joy/dist/build/prerender";
import { PostsModel } from "../../model/posts.model";

@Prerender()
@Route({ path: "/posts", exact: true })
@ReactController()
export default class ListCtl extends ReactBaseController {
  @Autowire()
  public postsModel: PostsModel;

  async initialModelStaticState(urlParams: any): Promise<void> {
    await this.postsModel.fetchEntities();
  }

  async initialModelState(context: any): Promise<void> {
    await this.postsModel.fetchEntities();
  }

  onClickItem = (link, e) => {
    console.log(">>>d e");
    // @ts-ignore
    this.props.history.push(link);
  };

  renderView(): ReactNode {
    const { entities, total, pageSize, pageIndex } = this.postsModel.state;
    return (
      <>
        <div id="list">
          {entities.map((post) => {
            // return <div key={post.id+''}><span>{post.id}</span>: <Link href={`/posts/${post.id}`}><a >{post.title}</a></Link></div>
            return (
              <div key={post.id + ""}>
                <span>{post.id}</span>: <a onClick={this.onClickItem.bind(this, `/posts/${post.id}`)}>{post.title}</a>
              </div>
            );
          })}
        </div>
        =======
        <div>
          total: <span id="total">{total}</span>
          pageSize: <span id="pageSize">{pageSize}</span>
          pageIndex: <span id="pageIndex">{pageIndex}</span>
        </div>
      </>
    );
  }
}
