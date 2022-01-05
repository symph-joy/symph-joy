import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";
import { Layout, Typography, Button, Row, Input, Checkbox } from "antd";
import styles from "./homepage.scss";
import {
  AndroidOutlined,
  AppleOutlined,
  WindowsOutlined,
  IeOutlined,
  ChromeOutlined,
  GithubOutlined,
  GitlabOutlined,
  ClusterOutlined,
  ApartmentOutlined,
  FundOutlined,
  CloudServerOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { Prerender } from "@symph/joy";
import { DocsModel } from "../model/docs.model";
import { Inject } from "@symph/core";

const { Content } = Layout;
const { Paragraph } = Typography;

@Prerender()
@ReactController()
export default class HelloController extends BaseReactController {
  @Inject()
  public docModel: DocsModel;

  async initialModelStaticState(urlParams: any): Promise<void | number> {
    await this.docModel.getSnippet("/snippets/hello-react-controller");
  }

  renderView(): ReactNode {
    return (
      <Layout className={styles.layout}>
        <Content>
          {/* -------- banner -------- */}
          <section role="banner" className={styles.banner}>
            <Paragraph className={styles.banner__paragraph}>
              <h1>
                <div>@symph/joy 让 JS/TS 应用</div>
                <div className={styles.banner__wordWrap}>
                  <div style={{ "--j": 0 }}>
                    <span style={{ "--i": 1 }}>现</span>
                    <span style={{ "--i": 2 }}>代</span>
                    <span style={{ "--i": 3 }}>工</span>
                    <span style={{ "--i": 4 }}>程</span>
                    <span style={{ "--i": 5 }}>化</span>
                    {/*<span style={{ "--i": 6 }}>n</span>*/}
                    {/*<span style={{ "--i": 7 }}>.</span>*/}
                  </div>
                  <div style={{ "--j": 1 }}>
                    <span style={{ "--i": 1 }}>快</span>
                    <span style={{ "--i": 2 }}>速</span>
                    <span style={{ "--i": 3 }}>响</span>
                    <span style={{ "--i": 4 }}>应</span>
                    <span style={{ "--i": 5 }}>变</span>
                    <span style={{ "--i": 6 }}>化</span>
                    {/*<span style={{ "--i": 7 }}>v</span>*/}
                    {/*<span style={{ "--i": 8 }}>e</span>*/}
                    {/*<span style={{ "--i": 9 }}>.</span>*/}
                  </div>
                  <div style={{ "--j": 2 }}>
                    <span style={{ "--i": 1 }}>高</span>
                    <span style={{ "--i": 2 }}>效</span>
                    <span style={{ "--i": 3 }}>发</span>
                    <span style={{ "--i": 4 }}>布</span>
                    <span style={{ "--i": 5 }}>产</span>
                    <span style={{ "--i": 6 }}>品</span>
                    {/*<span style={{ "--i": 7 }}>t</span>*/}
                    {/*<span style={{ "--i": 8 }}>i</span>*/}
                    {/*<span style={{ "--i": 9 }}>v</span>*/}
                    {/*<span style={{ "--i": 10 }}>e</span>*/}
                    {/*<span style={{ "--i": 11 }}>.</span>*/}
                  </div>
                </div>
              </h1>

              <Row justify="center">
                <Button>了解 JOY</Button>
                <Button>快速开始</Button>
              </Row>
            </Paragraph>
          </section>

          {/* -------- news -------- */}
          <section role="news" className={styles.news}>
            <div className={styles.container}>
              <div className={styles.news__list}>
                <a href="#">Hello!</a>

                <a href="#">Bye Bye!</a>
              </div>
            </div>
          </section>

          {/* -------- function -------- */}
          <section role="function" className={styles.function}>
            <div className={styles.container}>
              <header>
                <h1 className={styles.function__title}>JOY 可以做什么</h1>
              </header>
              <div>
                <ul className={styles.function__list}>
                  <li>
                    <ApartmentOutlined />
                    <h2>面向对象设计</h2>
                    <p>将面向对象的设计思想运用到 JS/TS 应用，从 Joy 底层架构到业务领域，从React到Node，一次学习，多端适用。</p>
                  </li>
                  <li>
                    <FundOutlined />
                    <h2>React 应用</h2>
                    <p>提供完整的 React 应用解决方案，封装底层技术细节，快速编写页面和管理全局状态，能够快速构建和启动开发服务器，方便调试和打包。</p>
                  </li>
                  <li>
                    <CloudServerOutlined />
                    <h2>Node 应用</h2>
                    <p>类似 Spring Boot ，基于IoC，自动扫描业务组件，注册接口和中间件等，并提供数据库、缓存、安全等组件。（开发中）</p>
                  </li>
                  {/*<li>*/}
                  {/*  <ClusterOutlined />*/}
                  {/*  <h2>多端应用</h2>*/}
                  {/*  <p>可用于开发 Node 应用和浏览器应用，以及混合同构应用，适应多业务场景产品研发。</p>*/}
                  {/*</li>*/}
                  <li>
                    <ClusterOutlined />
                    <h2>多部署方案</h2>
                    <p>前后端可独立发布和运行，可将前端导出静态部署，或者运行为Node.js应用，实时渲染页面和提供数据服务。de3de</p>
                  </li>
                  {/*<li>*/}
                  {/*  <GithubOutlined />*/}
                  {/*  <h2>Event Driven</h2>*/}
                  {/*  <p>Dolore nisi ex sunt cillum nulla ad laboris minim laborum consequat cillum.</p>*/}
                  {/*</li>*/}
                  {/*<li>*/}
                  {/*  <GitlabOutlined />*/}
                  {/*  <h2>Batch</h2>*/}
                  {/*  <p>Sunt in veniam commodo anim.</p>*/}
                  {/*</li>*/}
                </ul>

                <div className={styles.function__description}>
                  <code>
                    <span className={styles.function__description_cyan}>@ReactController()</span>
                    <br />
                    <span className={styles.function__description_yellow}>
                      class <span className={styles.function__description_orange}>DemoComponent</span> extends{" "}
                      <span className={styles.function__description_orange}>BaseReactController</span> {"\u007B"}
                    </span>
                    <br />
                    <span className={styles.function__description_cyan + " " + styles.function__description_indent}>
                      renderView() <span className={styles.function__description_yellow}>{"\u007B"}</span>
                    </span>
                    <br />
                    <span className={styles.function__description_indentDouble}>
                      <span className={styles.function__description_yellow}>return</span>{" "}
                      <span className={styles.function__description_green}>&lt;div&gt;</span>
                      Hello World!
                      <span className={styles.function__description_green}>&lt;div/&gt;</span>
                    </span>
                    <br />
                    <span className={styles.function__description_yellow + " " + styles.function__description_indent}>{"\u007D"}</span>
                    <br />
                    <span className={styles.function__description_yellow}>{"\u007D"}</span>
                  </code>

                  <div className={styles.function__description_info}>
                    <h2>Level up your JavaScript code</h2>
                    <p>
                      With <a href="#">Symph Joy</a> in your app, just a few lines of codes is all you need to start building web pages like a boss.
                    </p>
                    <p>
                      New to Symph Joy? Try our simply <a href="#">quickstart guide</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* -------- footer -------- */}
          <footer role="footer" className={styles.footer}>
            <div className={styles.footer__top}>
              <div className={styles.container}>
                <ul>
                  <li>
                    <h3>Get ahead</h3>
                    <p>Deserunt dolor dolore excepteur ut ipsum in proident aliquip ut commodo aliqua aliquip ea.</p>
                    <a href="#">Learn more</a>
                  </li>
                  <li>
                    <h3>Get support</h3>
                    <p>Officia proident aliquip sint cupidatat.</p>
                    <a href="#">Learn more</a>
                  </li>
                  <li>
                    <h3>Upcoming events</h3>
                    <p>Ea nisi sit cillum irure labore nulla mollit sunt nulla eiusmod ea proident voluptate exercitation.</p>
                    <a href="#">Learn more</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className={styles.footer__bottom}>
              <div className={styles.container}>
                <ul>
                  <li>Why Symph Joy</li>
                  <li>Microservices</li>
                  <li>Reactive</li>
                  <li>Event Driven</li>
                  <li>Cloud</li>
                  <li>Web Applications</li>
                  <li>Serverless</li>
                  <li>Batch</li>
                </ul>
                <ul>
                  <li>Learn</li>
                  <li>Quickstart</li>
                  <li>Guides</li>
                  <li>Blog</li>
                </ul>
                <ul>
                  <li>Community</li>
                  <li>Events</li>
                  <li>Team</li>
                </ul>
                <div className={styles.footer__bottom_subscribe}>
                  <h2>Get the Symph Joy newsletter</h2>
                  <Input.Search size="large" placeholder="Email Address" enterButton={<Button>SUBSCRIBE</Button>} />
                  <Checkbox>Yes, I would like to be contacted by The Symph Joy Team for newsletters, promotions and events</Checkbox>
                </div>
              </div>
            </div>
          </footer>
        </Content>
      </Layout>
    );
  }
}
