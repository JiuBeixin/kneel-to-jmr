# ⚔️ JMR 帝国 · 一键称臣

恶搞项目：**向「JMR 帝国」俯首称臣**。每位称臣者都是一条 GitHub Issue —— 数据库就是 Issues，名册直接读 Issue。

**纯静态、零后端、零 Token**：整个项目托管在 GitHub Pages，不需要 Vercel/云函数/密钥。

## 工作原理

| 环节 | 怎么实现 |
| --- | --- |
| 「称臣」提交 | 按钮跳转到**预填好的 New Issue 页面**，访客用自己的 GitHub 账号点一下 `Submit new issue` |
| 数据库 | GitHub Issues —— 每条「称臣」= 一条带 `称臣` 标签的 Issue |
| 名册展示 | 浏览器直接调用 GitHub REST API 读取 Issues（公开仓库读 Issue 无需鉴权，支持 CORS） |

> ⚠️ 为什么不是「真·一键」？GitHub **创建 Issue 必须鉴权**，而静态页面无法安全保存密钥。所以这里借用了 GitHub 官方「预填 Issue」功能：一键跳到写好的圣旨，再点一下提交。访客需要有 GitHub 账号并已登录。

## 部署步骤

### 1. 建仓库
1. 在 GitHub 新建一个 **Public** 仓库（例如 `kneel-to-jmr`）。
2. 把本目录所有文件推上去。

```bash
git init
git add .
git commit -m "JMR 帝国 · 一键称臣"
git branch -M main
git remote add origin https://github.com/<你的用户名>/kneel-to-jmr.git
git push -u origin main
```

> 建议单独用一个仓库当「名册」，别和重要项目的 Issue 混在一起。

### 2. 改配置
编辑 `config.js`，填上你的用户名和仓库名：

```js
window.JMR_CONFIG = {
  OWNER: "你的GitHub用户名",
  REPO: "kneel-to-jmr"
};
```

### 3. 开启 GitHub Pages
仓库 → **Settings → Pages**：
- Source：`Deploy from a branch`
- Branch：`main`，目录 `/ (root)`

保存后等 1~2 分钟，访问 `https://<你的用户名>.github.io/kneel-to-jmr/`。

### 4. 完成 🎉
填个尊号点 **⚔️ 一键称臣** → 在跳出的 GitHub 页面点 `Submit new issue` → 回来看「帝国臣民名册」刷出自己的名字。

## 自定义

- **封号列表**：改 `script.js` 里的 `TITLES`
- **Issue 标题 / 正文模板**：改 `script.js` 里 `form.addEventListener("submit")` 中的 `body` 和 `issueTitle`
- **文案、配色、御像**：改 `index.html` / `style.css`（御像就是根目录的 `jmr.jpg`，可换图）

## 限制 & 免责声明

- 访客需要有 GitHub 账号并已登录，否则无法提交。
- 名册读取走 GitHub 未认证 API（60 次/小时/IP），人多时可能被限流；名册最多显示前 100 位。
- 同一尊号只能靠前端查重（软提示），可被绕过——恶搞项目，开心就好。
- 纯恶搞，别当真；被 JMR 大佬本人发现后请自行谢罪 🙇。

---

### 如果以后想要「真·一键、访客无需登录」

那必须有一个小后端替你持 Token 提交 Issue（Vercel / Cloudflare Pages Functions / Netlify Functions 均可）。原理：前端 POST 给函数 → 函数用环境变量里的 Token 调 GitHub API 创建 Issue → 返回结果。若需要，我可以再帮你加回这版。
