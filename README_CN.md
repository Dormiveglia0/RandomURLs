### 第1步：创建 Cloudflare 账户

如果您还没有账户，请访问 [Cloudflare 官网](https://www.google.com/search?q=https://dash.cloudflare.com/sign-up) 注册一个免费账户。

### 第2步：创建 Worker 服务

1.  登录 Cloudflare 控制台后，在左侧菜单中找到并点击 **Workers & Pages**。
2.  点击 **Create application** (创建应用程序)，然后选择 **Create Worker** (创建 Worker)。
3.  为您的 Worker 指定一个唯一的名称（例如 `my-link-fuser-api`），然后点击 **Deploy** (部署)。

### 第3步：配置 Worker 代码

1.  部署成功后，点击 **Edit code** (编辑代码) 进入在线代码编辑器。
2.  编辑器中会有一段默认的 "Hello World" 代码。请**完全删除**这些代码。
3.  将 `worker.js` 文件的**全部内容**复制并粘贴到这个在线编辑器中。
4.  点击右上角的 **Deploy** (部署) 按钮来保存和发布您的代码。

### 第4步：创建并绑定 KV 存储

KV 是 Cloudflare 的键值数据库，我们将用它来存储您的链接池数据。

1.  **创建 KV 数据库**
    *   在 Cloudflare 控制台的左侧菜单中，找到并点击 **KV**。
    *   点击 **Create a namespace** (创建命名空间)。
    *   为您的数据库起一个名字（例如 `link-fuser-data`），然后点击 **Add** (添加)。
2.  **将数据库绑定到 Worker**
    *   返回到您的 Worker 管理页面（**Workers & Pages** -> 点击您的Worker）。
    *   进入 Worker 页面后，点击 **Settings** (设置) 选项卡，然后选择 **Variables** (变量) 子菜单。
    *   向下滚动到 **KV Namespace Bindings** (KV 命名空间绑定)，然后点击 **Add binding** (添加绑定)。
    *   在 **Variable name** (变量名称) 字段中，**必须**输入 `LINK_FUSER_KV`。这必须与 `worker.js` 代码中的 `env.LINK_FUSER_KV` 严格对应。
    *   在 **KV namespace** (KV 命名空间) 字段，点击下拉菜单并选择您刚刚创建的数据库（`link-fuser-data`）。
    *   最后，点击页面底部的 **Save and deploy** (保存并部署) 以使绑定生效。

### 第5步：获取 Worker URL 并配置前端文件

1.  返回您的 Worker 的主管理页面（概览页面）。您会在右上角看到您的 Worker 的 URL，格式通常是 `https://<您的Worker名称>.<您的子域名>.workers.dev`。请**复制**这个 URL。
2.  回到您的 `index.html` 文件。
3.  在这个文件中，您需要找到**一处** `'YOUR_WORKER_URL_HERE'` 占位符。
4.  将这两处占位符**全部替换**为您刚刚复制的 Worker URL。

**示例：** 如果您的 Worker URL 是 `https://my-link-fuser-api.user.workers.dev`，那么代码中的配置应该改为：

```text-plain
const WORKER_URL = '[https://my-link-fuser-api.user.workers.dev](https://my-link-fuser-api.user.workers.dev)';

```

### 第6步：部署前端页面

现在您的前端文件已经配置好了。您可以将 `index.html` 部署到任何地方：

*   **推荐方式**：使用 Cloudflare Pages (与 Workers 在同一个地方管理，非常方便)。
*   **其他方式**：GitHub Pages、Vercel，或者您自己的任何静态网站托管服务器。

部署完成后，访问您的前端页面 URL，就可以开始使用了！所有数据都将安全地保存在您的 Cloudflare KV 存储中。
