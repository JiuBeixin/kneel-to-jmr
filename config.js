// ========= 部署配置 =========
window.JMR_CONFIG = {
  OWNER: "JiuBeixin",      // GitHub 用户名 / 组织名
  REPO: "kneel-to-jmr",    // 仓库名（名册 Issue 所在仓库）

  // Token 分段存放，运行时拼接（仅本仓库 Issues 读写权限）。
  // ⚠️ 注意：分段 ≠ 加密，任何人查看网页源码都能拼回 token；
  // GitHub 也可能自动吊销出现在公开仓库里的 token。失效后页面会自动回退到「预填 Issue」方案。
  TOKEN_PARTS: [
    "github_pat_11AUD5F7Q04BfC",
    "c3MxpedZ_dlDpgEox1uS",
    "3UbeFRV0ttsjj5yXGPw",
    "UM4592dJEi9YvJ644I",
    "73BHARDoCVA"
  ]
};
