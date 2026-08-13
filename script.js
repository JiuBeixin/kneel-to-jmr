const cfg = window.JMR_CONFIG || {};
const OWNER = cfg.OWNER || "";
const REPO = cfg.REPO || "";
// 运行时把分段 token 拼装回来
const TOKEN = (cfg.TOKEN_PARTS || []).join("");

const GITHUB_API = "https://api.github.com";

const $ = (s) => document.querySelector(s);

const form = $("#kneel-form");
const nameInput = $("#name");
const messageInput = $("#message");
const resultEl = $("#result");
const rosterEl = $("#roster");
const rosterMeta = $("#roster-meta");
const repoLink = $("#repo-link");
const submitBtn = $("#submit-btn");
const refreshBtn = $("#refresh-btn");

const ISSUES_API = `${GITHUB_API}/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&sort=created&direction=asc`;
const ISSUES_URL = `${GITHUB_API}/repos/${OWNER}/${REPO}/issues`;
const NEW_ISSUE_BASE = `https://github.com/${OWNER}/${REPO}/issues/new`;

const TITLES = [
  "帝国开国元勋",
  "御前带刀侍卫",
  "九品芝麻官",
  "镇国大将军",
  "御膳房总管",
  "锦衣卫千户",
  "翰林院大学士",
  "帝国首席乐师",
  "御猫饲养员",
  "皇宫扫地僧",
  "马前卒",
  "玉阶侍卫"
];

if (OWNER && REPO) repoLink.href = `https://github.com/${OWNER}/${REPO}/issues`;

function ghHeaders() {
  const h = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

function pickTitle() {
  return TITLES[Math.floor(Math.random() * TITLES.length)];
}

function parseMarker(body) {
  const m = /<!--\s*kneel-json:\s*(\{[\s\S]*?\})\s*-->/i.exec(body || "");
  if (!m) return {};
  try { return JSON.parse(m[1]); } catch { return {}; }
}

function extractName(title) {
  const m = /【称臣】(.*?)俯首称臣/.exec(title || "");
  if (m) return m[1].trim();
  return (title || "").replace(/^⚔️【称臣】/, "").replace(/俯首称臣$/, "").trim();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function buildBody(name, message, title) {
  return [
    `> ⚔️ 朕已阅。准卿所奏，封卿为 **${title}**。`,
    "",
    "| 项目 | 内容 |",
    "| --- | --- |",
    `| 臣名 | ${name} |`,
    `| 效忠宣言 | ${message || "（无）"} |`,
    `| 称臣时间 | ${new Date().toISOString()} |`,
    "",
    `<!-- kneel-json: ${JSON.stringify({ name, message, title })} -->`
  ].join("\n");
}

function prefillUrl(issueTitle, body) {
  return `${NEW_ISSUE_BASE}?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent("称臣")}`;
}

let rosterCache = [];

function showResult(html) {
  resultEl.innerHTML = html;
  resultEl.hidden = false;
}

async function loadRoster() {
  if (!OWNER || !REPO) {
    rosterMeta.textContent = "请先在 config.js 里填写 OWNER 和 REPO";
    return;
  }
  rosterMeta.textContent = "正在清点臣民……";
  try {
    // GitHub 列表接口响应带 max-age=60，浏览器会缓存旧名单；
    // 用 no-store + 时间戳强制每次拿最新数据
    const url = `${ISSUES_API}&t=${Date.now()}`;
    let r = await fetch(url, { headers: ghHeaders(), cache: "no-store" });
    // token 失效/被吊销时，退回无鉴权读取（公开仓库仍可读）
    if ((r.status === 401 || r.status === 403) && TOKEN) {
      r = await fetch(url, {
        headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
        cache: "no-store"
      });
    }
    if (!r.ok) throw new Error("HTTP " + r.status);
    const issues = await r.json();
    const items = (issues || [])
      .filter((i) => !i.pull_request && /【称臣】/.test(i.title || ""))
      .map((i) => {
        const info = parseMarker(i.body);
        return {
          number: i.number,
          name: info.name || extractName(i.title),
          message: info.message || "",
          time: i.created_at,
          url: i.html_url
        };
      });
    rosterCache = items;
    const capNote = (issues || []).length >= 100 ? "（名册最多显示前 100 位）" : "";
    rosterMeta.textContent = `帝国已有 ${items.length} 位臣民 ${capNote}`;
    renderRoster(items);
  } catch (e) {
    rosterMeta.textContent = "名册加载失败：" + e.message + "（可能是 GitHub API 限流，稍后再试）";
  }
}

function renderRoster(items) {
  rosterEl.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "暂无臣民，等待第一位义士……";
    rosterEl.appendChild(li);
    return;
  }
  items.forEach((it) => {
    const li = document.createElement("li");
    const box = document.createElement("div");
    box.className = "roster-item";

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = `#${it.number}`;

    const name = document.createElement("a");
    name.className = "roster-name";
    name.href = it.url;
    name.target = "_blank";
    name.rel = "noopener";
    name.textContent = it.name;

    const msg = document.createElement("span");
    msg.className = "roster-msg";
    msg.textContent = it.message || "";

    const time = document.createElement("span");
    time.className = "roster-time";
    time.textContent = new Date(it.time).toLocaleString("zh-CN");

    box.append(rank, name, msg, time);
    li.appendChild(box);
    rosterEl.appendChild(li);
  });
}

function showPrefillFallback(issueTitle, body, rank, title, note) {
  window.open(prefillUrl(issueTitle, body), "_blank", "noopener,noreferrer");
  showResult(`<p class="result-title">📜 圣旨已拟好！</p>
    <p class="error">${escapeHtml(note)}</p>
    <p>已改为在新标签页打开 GitHub，请点击 <strong>Submit new issue</strong> 完成称臣。</p>
    <p>预计成为帝国第 <strong>${rank}</strong> 位臣民，封号 <strong>${title}</strong>。</p>
    <p>提交完成后，点下方「🔄 刷新名册」查看自己上榜。</p>`);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (!name) return;
  if (!OWNER || !REPO) {
    showResult('<p class="error">请先在 config.js 里填写 OWNER 和 REPO</p>');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "⏳ 上表称臣中……";
  resultEl.hidden = true;

  const dup = rosterCache.some((it) => it.name.toLowerCase() === name.toLowerCase());
  const rank = rosterCache.length + 1;
  const title = pickTitle();
  const body = buildBody(name, message, title);
  const issueTitle = `⚔️【称臣】${name} 俯首称臣`;
  const dupNote = dup
    ? `<p class="error">⚠️ 此尊号似乎已称臣，执意再表一份也行（会被 JMR 发现）。</p>`
    : "";

  try {
    if (TOKEN) {
      const r = await fetch(ISSUES_URL, {
        method: "POST",
        headers: { ...ghHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ title: issueTitle, body })
      });
      if (r.ok) {
        const issue = await r.json();
        showResult(`<p class="result-title">🎉 圣旨到！</p>
          <p>朕已阅，准 <strong class="result-name"></strong> 俯首称臣。</p>
          <p>封号：<strong class="result-title2"></strong></p>
          <p>你是帝国第 <strong class="result-rank"></strong> 位臣民。</p>
          ${dupNote}
          <a class="issue-link" href="#" target="_blank" rel="noopener">查看你的圣旨 Issue ↗</a>`);
        resultEl.querySelector(".result-name").textContent = name;
        resultEl.querySelector(".result-title2").textContent = title;
        resultEl.querySelector(".result-rank").textContent = rank;
        resultEl.querySelector(".issue-link").href = issue.html_url;
        resultEl.hidden = false;
        nameInput.value = "";
        messageInput.value = "";
        loadRoster();
      } else {
        showPrefillFallback(issueTitle, body, rank, title, `直接上表失败（HTTP ${r.status}，token 可能已失效）`);
      }
    } else {
      showPrefillFallback(issueTitle, body, rank, title, "未配置 token");
    }
  } catch (err) {
    showPrefillFallback(issueTitle, body, rank, title, `直接上表失败（${err && err.message}）`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "⚔️ 一键称臣";
  }
});

refreshBtn.addEventListener("click", loadRoster);

loadRoster();
