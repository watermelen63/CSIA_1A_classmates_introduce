const DATA_URL = "data.json";

async function loadItems() {
  const grid = document.getElementById("grid");

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();

    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = `<div class="empty-state">目前沒有資料。</div>`;
      return;
    }

    grid.innerHTML = items.map(renderCard).join("");
  } catch (err) {
    console.error("讀取 data.json 失敗：", err);
    grid.innerHTML = `<div class="error-state">資料載入失敗，請確認 data.json 存在且格式正確。</div>`;
  }
}

function renderCard(item) {
  const title = escapeHtml(item.title ?? "");
  const url = escapeAttr(item.url ?? "#");
  const image = escapeAttr(item.image ?? "");
  const description = escapeHtml(item.description ?? "");

  return `
    <article class="card">
      <a class="card-link" href="${url}" target="_blank" rel="noopener noreferrer">
        <div class="thumb">
          <img src="${image}" alt="${title}" loading="lazy" />
        </div>
        <div class="card-body">
          <p class="card-title">${title}</p>
          <p class="card-desc">${description}</p>
        </div>
      </a>
    </article>
  `;
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

document.addEventListener("DOMContentLoaded", loadItems);
