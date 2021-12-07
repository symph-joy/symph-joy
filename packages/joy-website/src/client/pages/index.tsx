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

          {/* -------- carousel -------- */}
          <Carousel className={styles.carousel}>
            <div role="carousel page">
              Enim ut excepteur Lorem cupidatat. Incididunt Lorem est eu proident pariatur incididunt in laboris nisi nulla. Consectetur enim
              cupidatat mollit laborum id do aute nulla culpa elit ad occaecat nostrud. Minim eiusmod culpa non est in deserunt amet pariatur pariatur
              sit eiusmod ex.
            </div>
            <div role="carousel page">
              Ullamco veniam commodo aliquip fugiat quis sint occaecat ut. Cillum ipsum id adipisicing ex quis. Officia dolor eu duis laboris ut elit
              laboris esse exercitation. Id dolor officia ex veniam voluptate proident occaecat ullamco voluptate.
            </div>
            <div role="carousel page">
              Esse do deserunt ut incididunt id labore proident ad incididunt tempor aute laboris tempor laboris. In proident officia magna cupidatat
              aliqua in deserunt duis labore ad. Et minim Lorem mollit ex enim sint sit duis dolor aliquip in velit aliquip.
            </div>
          </Carousel>

          {/* -------- part 2 --------*/}
          <section role="part2" className={styles.section + " " + styles.section_2}>
            <div className={styles.section_2__left}>
              Reprehenderit laboris sint quis eu sunt voluptate aliquip labore voluptate duis et. Sit commodo non mollit voluptate ad. Enim fugiat
              dolor sunt velit id sunt non sint deserunt veniam in qui adipisicing. Anim officia pariatur nostrud non consectetur incididunt fugiat
              nulla irure incididunt. Eiusmod amet culpa ea cillum nisi in quis irure officia elit. Qui ut duis dolore voluptate dolor qui velit.
              Dolore pariatur sit proident incididunt sit ut amet voluptate.
            </div>
            <div className={styles.section_2__right}>
              <h3>Deserunt commodo tempor consectetur fugiat minim ullamco nulla in dolor est ea.</h3>
              <p>
                Aliqua mollit pariatur qui occaecat voluptate voluptate anim laborum quis anim sunt nulla magna ipsum. Esse pariatur Lorem deserunt
                quis amet deserunt exercitation ullamco dolor pariatur consequat esse aliqua.
              </p>
              <p>
                Sunt veniam eiusmod duis sint eu magna excepteur dolore laboris eu non officia id. Duis nulla minim dolor magna fugiat. Duis ex labore
                occaecat incididunt laboris sit in. Excepteur culpa ad voluptate non nulla consectetur deserunt laboris ad ex laborum ad duis aute.
              </p>
            </div>
          </section>

          {/* -------- part 3 -------- */}
          <section role="part3" className={styles.section + " " + styles.section_3}>
            <h2 className={styles.section_3__title}>What Symph Joy can do</h2>

            <ul className={styles.section_3__list}>
              <li className={styles.section_3__item}>
                <AndroidOutlined />
                <h3>Incididunt</h3>
                <p>Quis veniam enim ipsum reprehenderit eiusmod dolore pariatur mollit duis ex dolore laborum.</p>
              </li>
              <li className={styles.section_3__item}>
                <AppleOutlined />
                <h3>Officia</h3>
                <p>Quis nisi laboris dolor qui nostrud esse et consectetur.</p>
              </li>
              <li className={styles.section_3__item}>
                <WindowsOutlined />
                <h3>Laboris</h3>
                <p>Qui irure incididunt enim id in excepteur cupidatat sit anim tempor mollit cillum commodo.</p>
              </li>
              <li className={styles.section_3__item}>
                <GithubOutlined />
                <h3>Consectetur</h3>
                <p>Deserunt consectetur qui id laborum ea velit laborum tempor magna nulla labore.</p>
              </li>
              <li className={styles.section_3__item}>
                <TwitterOutlined />
                <h3>Aute</h3>
                <p>Veniam id ex sunt voluptate elit.</p>
              </li>
              <li className={styles.section_3__item}>
                <GitlabOutlined />
                <h3>Proident</h3>
                <p>Ex nulla laborum dolor duis.</p>
              </li>
            </ul>
          </section>
        </Content>
      </Layout>
    );
  }
}
