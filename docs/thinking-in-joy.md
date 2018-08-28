
# 了解 @symph/joy

我们希望有一个结合了next.js和dva优点的基础框架，它们都是目前非常流行的前端框架，next.js为我们解决了服务端渲染和零配置的问题，而dva能够更好的管理应用中的业务流程和数据，但两者现有结合的方案里，我们遇到了些问题，并尝试解决这些问题之后，发现直接import集成是无法完整的发挥其各自的优势的，甚至还不得不做出一些妥协，虽然他们的着重点相同，但实际上还是前端框架，模块直接难免会有冲突，所以我们选择以一个全新的起点出发，取他们的优点，创建了@symph/joy，希望她能像其名字一样(交响曲-欢乐颂)，融合了前端的各种最佳实践，创建出一首交响曲，能给我们带来欢乐。 

## 集成next.js和dva遇到的一些问题
- 数据获取方法存在于dva `model`和next.js `getInitialProps`两个地方，如何统一？在服务端渲染时，无法调用model中的业务方法来初始化应用数据，只能将获取方法放在next.js里getInitialProps里，然后将获取到的数据作initState来初始化dva的store。而我们希望，所有的业务都只存在于model中，不管是在服务端渲染加载页面初始数据时，还是浏览器上用户交互时，都可以自由的调用model中的业务方法来获取、处理数据。
- 不同的router体系，如何统一为react-router-4？next.js使用文件系统路由，一个页面对应目录中的一个文件，切换页面时，上个页面的内容和数据将会被完全销毁，被新的界面替换，这让页面数据恢复、数据共享、局部更新等功能实现起来较困难，而react-router-4却能轻松解决这些问题。 例如我们有个分页展示的产品列表页，当点击某个产品进入详情页后，点击返回按钮再次回到列表页，但此时之前的列表数据已经不存在了，无法恢复到用户之前浏览到的位置，只能重新获取第一页数据。
- 如何调用多层嵌套route中的数据初始化方法？react-route-4的路由是动态的，无法使用类似next.js的方式，在最外层的route上定义`getInitialProps`来加载整个页面的数据。为了保证模块间的独立性，我们仍然希望各业务组件的数据获取方法，定义在组件其内部。
- dva `model`在服务端不能重复载入问题？dva中的model是单例的， 在服务端每次请求都会创建新的dva实例，而重新载入model，此时会对model对象进行修改，例如给reducers方法名称前添加namespace前缀。

## 需要一个怎样的基础框架

### 远离复杂的配置

这点继承于next.js，从项目创建、启动测试和打生产包，都不用编写任何配置(webpack、开发调试插件、热加载插件、样式处理插、混淆压缩插件等)，默认配置已经能够保证应用良好运行。

我们并不希望把配置做的大而全，而是把常用的，可能存在差异的配置做成了配置插件，例如less、sass、图片加载插件等，开发者可以根据需要选用需要的插件，或者轻松的封装自定义插件。

### 简单的项目结构

框架对项目目录结构有一些约定，例如静态文件目录`static`、源代码目录`src`、编译输出目录`.joy`等，这没什么难点，只是一个约定，也可以通过配置修改目录结构。

采用工程化的MVC分层思想，保证架构层、功能模块、目录的职责明确、依赖清晰，以便项目不断更新迭代，以及多人协同开发。

例如：在以往，我们为了在加载页面之前获取页面数据，通常在路由组件定义路径的时候也需要定义一个获取页面数据方法，这让路由组件处理了路由以外的业务，也让本该属于一个业务组件的逻辑定义在其它地方，看起来都不算是一个好方案. 在@symph/joy里，可以把组件获取数据的业务方法放其内部，系统可以保证在界面渲染之前，调用这个方法来加载组件相关的数据，开发人员可以专心的在业务组件内部实现其所有的功能。

> 为什么不采用其它的类似MVVM的框架呢？稍后会有更详细的讨论。

### 简化前端技术概念

前端的技术概念层出不穷，npm的包数量已经超越maven，整个技术栈已经不亚于java后台的服务架构，且不同的工具库内部，还有各种各样的概念，要把这些技术组合在一起，形成一个高效的框架，并不是一件容易的事儿。例如仅redux涉及的概念就有store、middleware、state、dispatch、connect、action、ActionConst、actonCreater、reducer、promise-thunk、saga(helper、effects、task、yield*)等，这让学习成本变得很高，也不利于在不同技术栈的团队间分享资源，即使采用了相同的技术库，不同的团队之间代码风格，实现细节也会有的差异。

@symph/joy，从一个整体框架出发，屏蔽了复杂的底层技术细节，以一个工程的界面展现给开发者，尽量减少新概念的引入，仅用两个概念`@controller` `@model`实现了MVC组件、依赖注册、服务端渲染等高级功能，了为了减少对业务代码的侵入，使用装饰器`@`的方式将普通Class标识为Controller和Model，同时简化了React+Redux的使用，开发人员甚至不用学习Redux的知识即可开始Model开发。

### 封装一些通用模块

- 支持`react-dom`的方式(`renderToStaticMarkup(<html><head></head><body></body></html>)`)渲染html文档，不引入其它的模板引擎
- es6、7、8高级语法支持，不管是在Node.js还是浏览器上运行的代码，都可以放心的使用高级语法
- css样式处理，PostCss集成、css样式提取等。
- 静态资源访问，只需要将图片、字体等文件放入`static`目录下，即可通过`/static/{patch}`访问
- 支持调试，不要任何配置，即可在开发环境支持热加载、热刷新、redux日志、断点调试等功能
- 加载优化，提高浏览器资源加载效率，提升用户体验，支持按需加载、依赖js提前载入、代码压缩、css压缩等

## MVC的思考

### 为什么不是MVVM？

MVC是最著名的软件架构，也是我们最容易理解，最基础的框架之一，其它架构大部分都是来自在特定技术环境下MVC的改进，例如：HMVC、MVA、MVP、MVVM。MVVM在前端开发社区里，也很流行，我们经常在争论遵循什么什么架构的是MVVM，MVVM有什么组件、没有什么组件，哪些数据该放在哪个ViewModel里等问题，其实这些疑问已经在阻碍了我们的开发工作了，框架的职责本就是定义系统该由哪些部分组成，以及各部分是如何工作的，从而减少这些疑问，让开发效率更高。从这点上讲，MVC的疑问好像要少的多，我们希望一切都变得简单，所以MVC成为了第一选择。

### 如何实现MVC

实现MVC的核心技术仅有React+Redux，Redux实现的是Model，React分为展现类组件(View)和控制类组件(Controller)。为了方便使用，@symph/joy提供了`@controller`和`@model`两个类装饰器，明确标识一个Class是Controller还是Model，这可有效的避免Class职责不明确，依赖混乱的问题。

他们各自的职责如下：
- Model: 管理应用的行为和数据，Class类，有初始状态(Redux store中的一部分内容)，业务过程中更新model状态(更新store的状态)
- View: 展示Model中的数据，继承React.Component，展示的数据来源于`props`
- Controller: 控制View的展示，绑定Model数据到View，响应用户的操作，调用Model中的业务, 被`@controller`注释的React.Component

### 如何编排业务流程？

在Model中定义的一个方法通常只处理一个业务，例如对象的增删改查方法为四个不同的业务流程，应保证业务方法的原子性和独立性时，但我们时常需要调用多个子业务来完成一件更大的事情，此时我们有两个选择，在Model或者Controller中组装业务，那到底改放在哪里呢？我们可以先回答下面几个问题：

- 组装的业务执行过程中，是否需要和用户交互？如果需要，适合放在Controller中组装，封装为可复用的交互组件
- 是否和某个具体的界面无关？即组合好的业务，在任何地方都可发起起调，而不会产生副作用，此时适合放在Model中组装
- 被组装的子业务，是否可以拆分出来，并发独立执行？可并发执行的业务，建议在Controller中根据页面功能组装，不可拆分的部分在Model中封装为一个大业务

#### 在Controller中组合业务

根据版面内容，和用户交互流程来组合业务。下面展示了一个博客首页加载数据的例子，需要获取当前登陆用户信息和博客列表。

```js
import React from 'react'
import controller, {requireModel} from '@symph/joy/controller'
import UserModel from '../models/UsersModel'
import BlogsModel from '../models/BlogsModel'
import Dialog from 'some-dialog'

@requireModel(UserModel, MessagesModel, BlogsModel)
@controller((store)=> ({
    me: store.users.me，
    blogs: store.blogs.list
}))
export default class IndexController extends React.Component {

    async componentDidmount () {
        let {dispatch} = this.props;

        Dialog.showLoadingProgress();
        
        // invoke services
        let [me, blogs] = await Promise.all([
            dispatch({type:'users/getUser'}),
            dispatch({type:'blogs/getBlogs', pageIndex:1, pageSize: 10});
        ]);
               
        if(me != null){
            // an user has logined， done some acton about the user.
        }

         Dialog.hideLoadingProgress();
    }

    render () {
        let {me, blogs} = this.props;
        return <div>me.name</div>
    }
}
```

#### 在Model中组装业务

在Model中也使用`this.dispatch(action)`来调用其它业务，和Controller中调用model中的业务方法一致。如果是调用Model自身的其它方法，可以直接执行函数调用。

下面假设了一个场景：用户在博客列表页，点击收藏了某个博客文章，调用服务端收藏接口成功后，为了保持本地数据一致，需要更新统计模块的收藏总数，以及博客列表中文章的收藏状态，使整个应用的数据状态保持一致和及时更新界面，下面使用了片段代码来演示如何实现。

```js
import React from 'react'
import model from '@symph/joy/model'
import UserModel from '../models/UsersModel'
import BlogsModel from '../models/BlogsModel'

@model()
export default class BlogsModel  {
    initState = {
        blogs: null, // all blogs in brower memory
        favBlogs: [], //all favourite blogs in brower memory
    };

    async favBlog({blog}) {
      let {favBlogs} = this.getState();
        let resp = await fetch(
            'https://www.example.com/api/blogs/fav',
            {blogId: blog.id},
            {method: 'POST'});

        blog.isFav = true;  // update the blog's fav status
        this.setState({
            favBlogs: [...favBlogs, blog]
        });

        await this.updateBlog({blog});  // invoke self service 

        // update the count of user‘s favourite blogs
        await this.dispatch({            // invoke other model’s service
            type: 'statistics/favBlogsCount',
            increase: 1
        });
    }

    /**
    * update the  blog, if the blog has changed
    **/
    async updateBlog({blog}){
        let {blogs} = this.getState();
        for (let i = 0; i < blogs.lenght; i++ ){
            if (blog.id === blogs[i].id){
                this.setState({
                    blogs: [...(blogs.splice(i, 1, blog))]
                })
                bread;
            }
        }
    }
}
```

### 作为Node.js服务端应用的View模块

[使用方法](https://lnlfps.github.io/symph-joy/#/getting-started?id=代码启动-server)

@symph/joy 可以作为express或者koa等框架的View模块，和传统的模板渲染方式不一样的是
- api接口和View完全分离，View是@symph/joy的一个应用，在服务端和客户端渲染界面时，根据需要主动从api里获取数据，express里不再编写任何界面相关的代码了
- 不需要给每个页面编写服务端路由，只需要一个能匹配@symph/joy应用所有页面路径的正则路径即可
- 不再需要任何其他模板技术（jade、handlebars、ejs等），使用React渲染出html内容和业务界面

## 服务端渲染的问题

### 同一份代码，在两端运行？

这个问题，看起来是如何实现同构的问题，但事实上现阶段实现前端同构应用还是件很困难的事，对框架和业务开发都是件有挑战的事，同构还只是停留在概念阶段。而我们想做的是，让开发人员在进行业务开发时拥有同构的体验，让框架来解决部分跨端运行的问题。在@symph/joy中，应用的Model、Controller和View组件都支持在两端运行，开发人员只需要专注于业务实现。

### 同构的模块

@symph/joy只将两端运行的有差异的模块进行了同构化，例如`fetch`方法使用了[isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch)库，当`fetch`识别到在服务端运行时，底层调用`node-fetch`来发送网络请求，如果是在浏览器上，则使用`whatwg-fetch`发送请求，在进行工功能开发是，我们只需要直接调用`fetch`方法来获取数据即可。

为了方便使用，@symph/joy-plugins提供的插件，都解决了日常开发中常见的跨端运行问题。

> 在使用第三方UI控件的时，要注意它是否支持服务端渲染。

### 自动编译到目标环境

在Node.js和浏览器上运行的js代码并不是完全相同的，例如在Node.js上不需要加载样式、不加载图片、动态import模块无法同步渲染等。他们执行的结果也不一样，Node.js主要是渲染出html，客户端则是渲染出用户可见的画面。同时需要针对目标环境做打包优化，在所以@symph/joy提供了两套webpack配置，将同一份源码编译到浏览器和服务器上的两套代码，在编译时，这两个编译过程会同步进行以提高编译效率。

下面列举了两端打包的一些差异性

客户端
- 开发环境输出错误详情
- 热加载插件
- 代码混淆压缩
- 公共代码提取
- 应用入口Component标识

服务端
- `import`导入指令替换为同步方式导入，支持服务端渲染


### `componentPrepare` 生命周期

在用户请求页面时，服务端加载页面所包含的组件，运行所有`controller`组件的`componentPrepare`方法，获取组件需要的数据，然后渲染出html文档，最后在浏览器上渲染DOM和绑定事件。`componentPrepare`方法保证了在服务端和客户端只执行一次数据获取。以上几个执行步骤，可以根据运行环境和配置，自动的安排其执行的地方，例如可以通过自定义配置，手动关闭服务端的html渲染，只预加载界面数据，浏览器直接使用数据渲染出界面，这样依然可以提升首屏渲染效率，同时也减少了服务端运行的部分压力，也可以完全关闭服务端的数据获取和html渲染两个步骤，全部执行步骤在浏览器上完成。

`componentPrepare`只是定义在`Controller`上的一个普通实例方法，框架在组件初始化时自动调用，也可以在运行的过程中手动调用，用于重新刷新界面数据等操作。

## 跨域问题

在浏览器上使用js发送的异步网络请求，处于安全考虑是不允许跨域的，常见的解决方案有jsonp或者在服务端集成一个代理服务器，在@sympy/joy中，我们希望前端开发也能拥有和原生开发一样的体验，不再为跨域请求烦恼，在@symph/joy中集成了一个自动代理转发服务，发送请求时只需要指定目标地址即可，例如`fetch('https://www.example.com/api/hello')`，`fetch`内部会判断是否跨域，以及是否启动代理转发请求。

代理服务在@symph/joy服务端上运行，所以如果打包成静态版本，部署在其它服务器或者静态文件服务器上，该功能将无法启动。如果部署在其它Node.js服务器上，依然可以通过手动集成`proxy-api-middleware`插件来启动该服务。

## 打包静态版本

静态版本即不需要Node.js做任何的渲染工作，也可以脱离Node.js运行。几乎不用做任何更改，就可以使用`joy export`将@symph/joy打包为静态版本，直接将打包后的输出文件(`out`目录下的所有文件)拷贝到静态服务器上就可完成部署，浏览器加载这些静态资源(js、css、image等)运行应用。静态版本依然支持@symph/joy提供的大部分功能，例如MVC组件、代码分割、动态路由等。

由于没有了Node.js服务端的支持，将失去服务端数据预加载、渲染、跨域请求代理转发等功能，对于用户的影响主要是首屏等待的时间更长，但代码压缩、按需加载、动态路由等功能依然能保证首屏加载足够快，建议此时添加页面加载动画，用户体验会更好。对于业务开发人员来说，跨域业务请求将不能直接发送，常见的解决方案有，在后方业务服务上返回`index.html`(静态版本中已经渲染好的html文件)文件，这样html文档和业务api请求在就在同一个域名下了，或者配置nginx反向代理，将业务请求和页面请求合并到同一个域名下，还可以使用jsonp发送跨域请求等。








