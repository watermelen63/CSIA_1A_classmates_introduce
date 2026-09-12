const DATA_URL = "data.json";

const ZOOM_DURATION = 450; // 需與 style.css 的 transition 時間一致
const TARGET_MAX_WIDTH = 1000; // 放大動畫「停止放大」時的最大寬度（px）
const TARGET_MAX_WIDTH_RATIO = 0.86; // 或視窗寬度的比例，取兩者較小值
const ASPECT_RATIO = 3 / 2; // 需與 .thumb 的 aspect-ratio 一致

let items = [];
let currentThumb = null;
let currentTimer = null;

async function loadItems() {
  const grid = document.getElementById("grid");

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      grid.innerHTML = `<div class="empty-state">目前沒有資料。</div>`;
      return;
    }

    items = data;
    grid.innerHTML = items.map(renderCard).join("");
    bindThumbEvents();
  } catch (err) {
    console.error("讀取 data.json 失敗：", err);
    grid.innerHTML = `<div class="error-state">資料載入失敗，請確認 data.json 存在且格式正確。</div>`;
  }
}

function renderCard(item, index) {
  const title = escapeHtml(item.title ?? "");
  const url = escapeAttr(item.url ?? "#");
  const image = escapeAttr(item.image ?? "");
  const description = escapeHtml(item.description ?? "");

  return `
    <article class="card">
      <button class="thumb" type="button" data-index="${index}" aria-label="放大檢視：${title}">
        <img src="${image}" alt="${title}" loading="lazy" />
      </button>
      <div class="card-body">
        <a class="card-title" href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
        <p class="card-desc">${description}</p>
      </div>
    </article>
  `;
}

function bindThumbEvents() {
  document.querySelectorAll(".thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      openLightbox(btn, items[index]);
    });
  });
}

function openLightbox(thumbEl, item) {
  if (!item) return;

  const backdrop = document.getElementById("lightboxBackdrop");
  const media = document.getElementById("lightboxMedia");
  const closeBtn = document.getElementById("lightboxClose");
  const img = document.getElementById("lightboxImg");
  const video = document.getElementById("lightboxVideo");

  clearTimeout(currentTimer);
  currentThumb = thumbEl;

  const startRect = thumbEl.getBoundingClientRect();
  const target = computeTargetRect(startRect);

  // 影片先重置，圖片先顯示
  media.classList.remove("is-playing");
  video.pause();
  video.removeAttribute("src");
  video.load();
  img.src = item.image ?? "";

  // 1. 先讓放大層完全對齊縮圖的位置與大小（不套用 transition）
  media.style.transition = "none";
  media.style.top = `${startRect.top}px`;
  media.style.left = `${startRect.left}px`;
  media.style.width = `${startRect.width}px`;
  media.style.height = `${startRect.height}px`;
  media.style.borderRadius = "4px";
  media.classList.add("is-open");
  backdrop.classList.add("is-open");
  closeBtn.classList.add("is-open");
  document.body.style.overflow = "hidden";

  // 強制重排，讓上面的初始樣式先生效
  void media.offsetHeight;

  // 2. 再套用 transition，並設定成放大後的目標位置與大小
  requestAnimationFrame(() => {
    media.style.transition = "";
    media.style.top = `${target.top}px`;
    media.style.left = `${target.left}px`;
    media.style.width = `${target.width}px`;
    media.style.height = `${target.height}px`;
  });

  // 3. 放大動畫結束、停止放大後，才切換成播放影片
  currentTimer = setTimeout(() => {
    if (item.video) {
      video.src = item.video;
      media.classList.add("is-playing");
      video.play().catch(() => {
        /* 使用者的瀏覽器可能需要互動才能自動播放，忽略錯誤即可 */
      });
    }
  }, ZOOM_DURATION);
}

function computeTargetRect(startRect) {
  const maxByRatio = window.innerWidth * TARGET_MAX_WIDTH_RATIO;
  const maxByViewportHeight = (window.innerHeight * 0.86) * ASPECT_RATIO;
  const width = Math.min(TARGET_MAX_WIDTH, maxByRatio, maxByViewportHeight);
  const height = width / ASPECT_RATIO;

  return {
    width,
    height,
    top: (window.innerHeight - height) / 2,
    left: (window.innerWidth - width) / 2,
  };
}

function closeLightbox() {
  const backdrop = document.getElementById("lightboxBackdrop");
  const media = document.getElementById("lightboxMedia");
  const closeBtn = document.getElementById("lightboxClose");
  const video = document.getElementById("lightboxVideo");

  clearTimeout(currentTimer);
  video.pause();
  media.classList.remove("is-playing");
  backdrop.classList.remove("is-open");
  closeBtn.classList.remove("is-open");
  document.body.style.overflow = "";

  if (currentThumb) {
    const rect = currentThumb.getBoundingClientRect();
    media.style.top = `${rect.top}px`;
    media.style.left = `${rect.left}px`;
    media.style.width = `${rect.width}px`;
    media.style.height = `${rect.height}px`;
  }

  currentTimer = setTimeout(() => {
    media.classList.remove("is-open");
    video.removeAttribute("src");
    video.load();
    currentThumb = null;
  }, ZOOM_DURATION);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
  loadItems();

  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxBackdrop").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
});
