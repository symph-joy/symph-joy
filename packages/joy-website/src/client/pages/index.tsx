import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";
import { Layout, Typography, Button, Row, Input, Checkbox } from "antd";
import styles from "./homepage.scss";
import { AndroidOutlined, AppleOutlined, WindowsOutlined, IeOutlined, ChromeOutlined, GithubOutlined, GitlabOutlined } from "@ant-design/icons";
import { Prerender } from "@symph/joy";

const { Content } = Layout;
const { Paragraph } = Typography;

@Prerender()
@ReactController()
export default class HelloController extends BaseReactController {
  renderView(): ReactNode {
    return (
      <Layout className={styles.layout}>
        <Content>
          {/* -------- banner -------- */}
          <section role="banner" className={styles.banner}>
            <Paragraph className={styles.banner__paragraph}>
              <h1>
                <div>Symph Joy makes JavaScript</div>
                <div className={styles.banner__wordWrap}>
                  <div style={{ "--j": 0 }}>
                    <span style={{ "--i": 1 }}>m</span>
                    <span style={{ "--i": 2 }}>o</span>
                    <span style={{ "--i": 3 }}>r</span>
                    <span style={{ "--i": 4 }}>d</span>
                    <span style={{ "--i": 5 }}>e</span>
                    <span style={{ "--i": 6 }}>n</span>
                    <span style={{ "--i": 7 }}>.</span>
                  </div>
                  <div style={{ "--j": 1 }}>
                    <span style={{ "--i": 1 }}>r</span>
                    <span style={{ "--i": 2 }}>e</span>
                    <span style={{ "--i": 3 }}>a</span>
                    <span style={{ "--i": 4 }}>c</span>
                    <span style={{ "--i": 5 }}>t</span>
                    <span style={{ "--i": 6 }}>i</span>
                    <span style={{ "--i": 7 }}>v</span>
                    <span style={{ "--i": 8 }}>e</span>
                    <span style={{ "--i": 9 }}>.</span>
                  </div>
                  <div style={{ "--j": 2 }}>
                    <span style={{ "--i": 1 }}>p</span>
                    <span style={{ "--i": 2 }}>r</span>
                    <span style={{ "--i": 3 }}>o</span>
                    <span style={{ "--i": 4 }}>d</span>
                    <span style={{ "--i": 5 }}>u</span>
                    <span style={{ "--i": 6 }}>c</span>
                    <span style={{ "--i": 7 }}>t</span>
                    <span style={{ "--i": 8 }}>i</span>
                    <span style={{ "--i": 9 }}>v</span>
                    <span style={{ "--i": 10 }}>e</span>
                    <span style={{ "--i": 11 }}>.</span>
                  </div>
                </div>
              </h1>

              <Row justify="center">
                <Button>WHY SYMPH JOY</Button>
                <Button>QUICKSTART</Button>
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
                <h1 className={styles.function__title}>What Smyph Joy can do</h1>
              </header>
              <div>
                <ul className={styles.function__list}>
                  <li>
                    <AndroidOutlined />
                    <h2>Microservices</h2>
                    <p>Lorem dolor elit exercitation amet eu occaecat ipsum enim cupidatat adipisicing elit Lorem minim.</p>
                  </li>
                  <li>
                    <AppleOutlined />
                    <h2>Reactive</h2>
                    <p>Id Lorem voluptate qui tempor incididunt.</p>
                  </li>
                  <li>
                    <WindowsOutlined />
                    <h2>Cloud</h2>
                    <p>Sit culpa culpa reprehenderit consectetur ea ea reprehenderit proident cupidatat sit occaecat voluptate ullamco.</p>
                  </li>
                  <li>
                    <IeOutlined />
                    <h2>Web apps</h2>
                    <p>Nisi exercitation sit id id sint ipsum aute qui nulla.</p>
                  </li>
                  <li>
                    <ChromeOutlined />
                    <h2>Serverless</h2>
                    <p>Elit veniam ad dolore fugiat cillum ad incididunt laborum.</p>
                  </li>
                  <li>
                    <GithubOutlined />
                    <h2>Event Driven</h2>
                    <p>Dolore nisi ex sunt cillum nulla ad laboris minim laborum consequat cillum.</p>
                  </li>
                  <li>
                    <GitlabOutlined />
                    <h2>Batch</h2>
                    <p>Sunt in veniam commodo anim.</p>
                  </li>
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
