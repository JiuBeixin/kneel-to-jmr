# ⚔️ JMR 帝国 · 一键称臣

恶搞项目：**向「JMR 帝国」俯首称臣**。每位称臣者都是一条 GitHub Issue —— 数据库就是 Issues，名册直接读 Issue。纯静态托管在 GitHub Pages，无后端。

## 工作原理

| 环节 | 怎么实现 |
| --- | --- |
| 「称臣」提交 | 浏览器直连 GitHub API，用 `config.js` 里的 Token 直接创建 Issue（真·一键） |
| 自动回退 | Token 失效/被吊销时，自动改走「预填 Issue 页面」两步方案 |
| 数据库 | GitHub Issues —— 每条「称臣」= 一条标题带 `⚔️【称臣】` 前缀的 Issue |
| 名册展示 | 浏览器调用 GitHub REST API 读取 Issues，按标题前缀过滤 |

## ⚠️ 安全须知（务必读）

Token 被**分段存进前端代码，运行时拼接**——但这**不是加密**：

- 任何人打开网页按 `F12` 就能看到全部分段并拼回 token；
- **GitHub 的 secret scanning 会自动吊销出现在公开仓库里的 token**，所以这个方案随时可能失效；
- 好在当前 token 只限权了 `kneel-to-jmr` 这个仓库的 Issues 读写，风险可控；
- **token 一旦泄露/被吊销，请到 GitHub 里 revoke 并重新生成**，再改 `config.js` 的 `TOKEN_PARTS`。

失效后页面不会坏：会自动回退到「预填 Issue」两步方案（访客用自己账号点一下 Submit）。

## 部署步骤

### 1. 改配置
编辑 `config.js`：

```js
window.JMR_CONFIG = {
  OWNER: "JiuBeixin",     // 你的 GitHub 用户名
  REPO: "kneel-to-jmr",   // 仓库名
  TOKEN_PARTS: [ /* 你的 token 分段 */ ]
};
```

### 2. 开启 GitHub Pages
仓库 → **Settings → Pages** → Source 选 `Deploy from a branch` → 分支 `master`（或你的默认分支）、目录 `/ (root)`。

保存后等 1~2 分钟，访问 `https://<用户名>.github.io/kneel-to-jmr/`。

### 3. 完成 🎉
填个尊号点 **⚔️ 一键称臣**，圣旨（Issue）即时生成，名册实时刷新。

## 自定义

- **封号列表**：改 `script.js` 里的 `TITLES`
- **Issue 标题 / 正文模板**：改 `script.js` 里的 `buildBody` 和 `issueTitle`
- **文案、配色、御像**：改 `index.html` / `style.css`（御像就是根目录的 `jmr.jpg`，可换图）

## 限制 & 免责声明

- 名册最多显示前 100 位；无 token 时读取走 GitHub 未认证限流。
- 同一尊号只能靠前端查重（软提示），可被绕过——恶搞项目，开心就好。
- 纯恶搞，别当真；被 JMR 大佬本人发现后请自行谢罪 🙇。
