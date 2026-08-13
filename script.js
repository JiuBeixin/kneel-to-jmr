const cfg = window.JMR_CONFIG || {};
const OWNER = cfg.OWNER || "";
const REPO = cfg.REPO || "";

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

const ISSUES_API = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&sort=created&direction=asc`;
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
    const r = await fetch(ISSUES_API);
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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (!name) return;

  if (!OWNER || !REPO) {
    showResult('<p class="error">请先在 config.js 里填写 OWNER 和 REPO</p>');
    return;
  }

  const dup = rosterCache.some((it) => it.name.toLowerCase() === name.toLowerCase());
  const rank = rosterCache.length + 1;
  const title = pickTitle();
  const now = new Date().toISOString();

  const body = [
    `> ⚔️ 朕已阅。准卿所奏，封卿为 **${title}**。`,
    "",
    "| 项目 | 内容 |",
    "| --- | --- |",
    `| 臣名 | ${name} |`,
    `| 效忠宣言 | ${message || "（无）"} |`,
    `| 称臣时间 | ${now} |`,
    "",
    `<!-- kneel-json: ${JSON.stringify({ name, message, title })} -->`
  ].join("\n");

  const issueTitle = `⚔️【称臣】${name} 俯首称臣`;
  const url = `${NEW_ISSUE_BASE}?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent("称臣")}`;

  window.open(url, "_blank", "noopener,noreferrer");

  const dupNote = dup
    ? `<p class="error">⚠️ 此尊号似乎已称臣，执意再表一份也行（会被 JMR 发现）。</p>`
    : "";
  showResult(`<p class="result-title">📜 圣旨已拟好！</p>
    <p>已在新标签页打开 GitHub，请点击 <strong>Submit new issue</strong> 完成称臣。</p>
    <p>预计成为帝国第 <strong>${rank}</strong> 位臣民，封号 <strong>${title}</strong>。</p>
    ${dupNote}
    <p>提交完成后，点下方「🔄 刷新名册」查看自己上榜。</p>`);

  nameInput.value = "";
  messageInput.value = "";
});

refreshBtn.addEventListener("click", loadRoster);

loadRoster();
