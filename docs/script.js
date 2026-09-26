/* aero·mirror — живые данные из репозитория */
"use strict";

const REPO = "Ka1Angell/auto-mirror";
const RAW = `https://raw.githubusercontent.com/${REPO}/main/githubmirror/`;

const META = {
  26: { title: "Обход белых списков", live: true, desc: "Единственный файл, где каждый сервер прошёл TCP-проверку живости — мёртвые выкидываются при каждой сборке. Подобран под SNI-домены, которые операторы не режут.", star: true },
  1:  { title: "OpenRay · валидированные", desc: "Сборник sakha1370 — прокси, прошедшие проверку валидатором." },
  2:  { title: "Мега-сборник", desc: "Огромный сырой микс от sevcator. Проверьте терпение клиента.", warn: "405k конфигов — не для телефона" },
  6:  { title: "roosterkid · openproxylist", desc: "Регулярно обновляемый открытый список прокси." },
  13: { title: "daily_free_vpn", desc: "Маленькая порция на каждый день." },
  14: { title: "LalatinaHub · Mineral", desc: "Аккуратные ноды из минеральной жилы." },
  17: { title: "V2rayCollector_Py · mix", desc: "Микс-коллектор MhdiTaheri на Python." },
  20: { title: "Argh94 · All_Config", desc: "Большой агрегированный список Proxy-List." },
  21: { title: "xray-config-toolkit", desc: "Base64-микс из тулкита wuqb2i4f." },
  22: { title: "base64 · mix-uri", desc: "Компактный base64-вариант смешанного списка." },
  23: { title: "igareck · BLACK VLESS RUS", desc: "VLESS-конфиги, заточенные под российские блокировки." },
  24: { title: "Mr-Meshky · vify", desc: "Компактный vless-набор проекта vify." },
  25: { title: "V2RayRoot · Config", desc: "Очередной живой срез vless-серверов." },
};

const $ = (id) => document.getElementById(id);
const toast = $("toast");
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function fmtSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " МБ";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " КБ";
  return bytes + " Б";
}

function esc(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function cardHTML(num, meta, size) {
  const url = RAW + num + ".txt";
  return `
  <article class="pebble card ${meta.star ? "featured" : ""}">
    <div class="card-top">
      <span class="badge ${meta.star ? "star" : ""}">${num}.txt</span>
      <h3>${esc(meta.title)}</h3>
    </div>
    <p>${esc(meta.desc)}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      ${size != null ? `<span class="size-pill"><i class="bi bi-droplet"></i> ${fmtSize(size)}</span>` : ""}
      ${meta.live ? `<span class="liveness"><i class="bi bi-activity"></i> TCP-проверено</span>` : ""}
      ${meta.warn ? `<span class="warn">${esc(meta.warn)}</span>` : ""}
    </div>
    <div class="card-actions">
      <button class="mini-btn green" data-copy="${url}"><i class="bi bi-clipboard-check"></i> Скопировать ссылку</button>
      <a class="mini-btn" href="${url}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Открыть .txt</a>
    </div>
  </article>`;
}

async function loadFiles() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/githubmirror`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const files = (await res.json()).filter((f) => f.name.endsWith(".txt"));

    const sizes = {};
    let total = 0;
    for (const f of files) {
      const n = parseInt(f.name, 10);
      if (!Number.isNaN(n)) { sizes[n] = f.size; total += f.size; }
    }

    const nums = Object.keys(sizes).map(Number).sort((a, b) => {
      if (a === 26) return -1;
      if (b === 26) return 1;
      return a - b;
    });

    $("fileGrid").innerHTML = nums
      .map((n) => cardHTML(n, META[n] || { title: `Источник №${n}`, desc: "Свежий срез из открытого коллектора конфигов." }, sizes[n]))
      .join("");

    $("statFiles").textContent = files.length;
    $("statSize").textContent = fmtSize(total);
  } catch (e) {
    $("fileGrid").innerHTML =
      `<div class="pebble card"><h3>Робот не отвечает…</h3><p>GitHub API не ответил. Обнови страницу чуть позже — зеркало продолжает работать.</p></div>`;
    $("statusText").textContent = "робот временно недоступен";
    $("pulse").style.background = "radial-gradient(circle at 35% 30%, #ffe3b0, #e8930c)";
  }
}

async function loadStatus() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=30`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const commits = await res.json();
    const robot = commits.find((c) => /Автообновление/.test(c.commit.message || ""));
    if (!robot) return;
    const msg = robot.commit.message.split("\n")[0];
    const m = msg.match(/:\s*(.+)$/);
    const stamp = m ? m[1] : msg;

    const mins = Math.max(0, Math.round((Date.now() - new Date(robot.commit.author.date).getTime()) / 60000));
    $("statAgo").textContent = mins === 0 ? "только что" : mins;
    $("statusText").textContent = `робот жив · последняя сборка: ${stamp}`;
  } catch (e) {
    /* тихо: loadFiles уже обработает ошибку статуса */
  }
}

document.addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-copy]");
  if (!btn) return;
  const url = btn.getAttribute("data-copy");
  const done = () => showToast("Ссылка скопирована — вставляй в клиент ✓");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
  } else {
    fallbackCopy(url, done);
  }
});

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); done(); } catch (e) { showToast("Скопируй вручную: " + text); }
  ta.remove();
}

loadFiles();
loadStatus();
