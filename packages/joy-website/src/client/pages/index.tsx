import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";
import { Layout, Typography, Button, Carousel, Row } from "antd";
import styles from "./homepage.less";
import { AndroidOutlined, AppleOutlined, WindowsOutlined, GithubOutlined, TwitterOutlined, GitlabOutlined } from "@ant-design/icons";
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
              <div className={styles.news_list}>
                <a href="#">Hello!</a>

                <a href="#">Bye Bye!</a>
              </div>
            </div>
          </section>

          {/* -------- function -------- */}
          <section role="function">
            <header>
              <h1 className={styles.function_title}>What Smyph Joy can do</h1>
            </header>
          </section>
        </Content>
      </Layout>
    );
  }
}
