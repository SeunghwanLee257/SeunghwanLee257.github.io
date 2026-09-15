// Storefront only. The copied SDK script owns the complete bidding experience.
const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );
const won = (value) => value.toLocaleString("ko-KR");
const heart =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
let products = [];
let category = "all";
let search = "";
let sort = "curated";
let saved = new Set();
const participated = new Set();
try {
  const value = JSON.parse(localStorage.getItem("walllnut-objects-saved") || "[]");
  if (Array.isArray(value)) saved = new Set(value.filter((id) => typeof id === "string"));
} catch {
  /* Optional favorites stay in memory. */
}

function render() {
  let visible = products.filter(
    (product) =>
      (category === "all" ||
        category === product.category ||
        (category === "saved" && saved.has(product.id))) &&
      (product.title + " " + product.subtitle).toLowerCase().includes(search.toLowerCase())
  );
  if (sort === "price-low") visible = visible.toSorted((a, b) => a.startingBid - b.startingBid);
  if (sort === "price-high") visible = visible.toSorted((a, b) => b.startingBid - a.startingBid);
  $("#collectionCount").textContent = String(visible.length).padStart(2, "0");
  $("#savedCount").textContent = products.filter((product) => saved.has(product.id)).length;
  $("#productGrid").innerHTML = visible.length
    ? visible
        .map(
          (product) =>
            '<article class="product-card" data-product-id="' +
            escape(product.id) +
            '"><div class="product-image"><button type="button" class="product-open" data-sellan-auction="' +
            escape(product.id) +
            '" aria-label="' +
            escape(product.title) +
            ' 경매 참여"><img src="' +
            escape(product.image) +
            '" alt="' +
            escape(product.subtitle) +
            ' 아트토이" width="1254" height="1254" loading="lazy"></button><span class="edition-tag">' +
            escape(product.edition) +
            '</span><button type="button" class="favorite" data-save="' +
            escape(product.id) +
            '" aria-label="' +
            escape(product.title) +
            ' 관심 작품" aria-pressed="' +
            saved.has(product.id) +
            '">' +
            heart +
            '</button></div><div class="product-copy"><p class="artist">' +
            escape(product.artist) +
            "</p><h3>" +
            escape(product.title) +
            '</h3><p class="product-subtitle">' +
            escape(product.subtitle) +
            '</p><div class="product-bottom"><div class="product-price"><small>시작 입찰가</small>' +
            won(product.startingBid) +
            '원</div><button type="button" class="bid-link" data-sellan-auction="' +
            escape(product.id) +
            '">입찰하기 <span aria-hidden="true">↗</span></button></div></div></article>'
        )
        .join("")
    : '<p class="empty-state">' +
      (category === "saved"
        ? "마음에 드는 작품의 하트를 눌러 담아보세요."
        : "조건에 맞는 작품이 없어요. 다른 이름으로 찾아보세요.") +
      "</p>";
}

function feature(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  $("#heroImage").src = product.image;
  $("#heroImage").alt = product.subtitle + " 아트토이";
  $("#featuredTitle").textContent = product.title;
  $("#featuredSubtitle").textContent = product.subtitle;
  $("#featuredPrice").innerHTML = won(product.startingBid) + "<span>원</span>";
  $("#featuredBid").dataset.sellanAuction = product.id;
  $(".image-tag").textContent =
    "THE COLLECTOR’S EDIT · " + String(products.indexOf(product) + 1).padStart(2, "0");
  document
    .querySelectorAll("[data-feature]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.feature === id))
    );
}

document.addEventListener("click", (event) => {
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    category = filter.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.classList.toggle("selected", button === filter);
      button.setAttribute("aria-pressed", String(button === filter));
    });
    render();
  }
  const favorite = event.target.closest("[data-save]");
  if (favorite) {
    const id = favorite.dataset.save;
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
    try {
      localStorage.setItem("walllnut-objects-saved", JSON.stringify([...saved]));
    } catch {}
    render();
  }
  const thumb = event.target.closest("[data-feature]");
  if (thumb) feature(thumb.dataset.feature);
});
$("#sortSelect").addEventListener("change", (event) => {
  sort = event.target.value;
  render();
});
$("#searchInput").addEventListener("input", (event) => {
  search = event.target.value.trim();
  render();
});
$("#clearSearch").addEventListener("click", () => {
  search = "";
  $("#searchInput").value = "";
  render();
  $("#searchInput").focus();
});
$("#searchToggle").addEventListener("click", () => {
  const panel = $("#searchPanel");
  panel.hidden = !panel.hidden;
  $("#searchToggle").setAttribute("aria-expanded", String(!panel.hidden));
  if (!panel.hidden) {
    $("#collection").scrollIntoView({ behavior: "smooth" });
    $("#searchInput").focus({ preventScroll: true });
  }
});
document.addEventListener("sellan:auction", (event) => {
  if (event.detail?.purpose !== "diagnostic") return;
  if (event.detail.type === "bid.submitted") participated.add(event.detail.productId);
  if (event.detail.type === "reset") participated.clear();
  $("#participationCount").textContent = participated.size;
});

const info = $("#infoDialog");
let infoTrigger;
let previousOverflow;
const closeInfo = () => {
  info.close();
  if (previousOverflow !== undefined) document.body.style.overflow = previousOverflow;
  previousOverflow = undefined;
  infoTrigger?.focus();
};
document.querySelectorAll("[data-open-info]").forEach((button) =>
  button.addEventListener("click", () => {
    infoTrigger = button;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    info.showModal();
    $("#closeInfo").focus();
  })
);
$("#closeInfo").addEventListener("click", closeInfo);
info.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeInfo();
});
$("#startFromInfo").addEventListener("click", () => {
  closeInfo();
  $("#collection").scrollIntoView({ behavior: "smooth" });
});

try {
  const response = await fetch("./catalog.json");
  if (!response.ok) throw new Error("catalog");
  const catalog = await response.json();
  if (catalog.purpose !== "diagnostic" || !Array.isArray(catalog.products))
    throw new Error("catalog");
  products = catalog.products;
  $("#galleryThumbs").innerHTML = products
    .map(
      (product, index) =>
        '<button type="button" data-feature="' +
        escape(product.id) +
        '" aria-label="' +
        escape(product.title) +
        ' 대표 사진 보기" aria-pressed="' +
        (index === 0) +
        '"><img src="' +
        escape(product.image) +
        '" alt="" width="40" height="40"></button>'
    )
    .join("");
  render();
  document.documentElement.dataset.storefront = "ready";
} catch {
  $("#productGrid").innerHTML =
    '<p class="empty-state" role="alert">작품을 불러오지 못했습니다. 페이지를 새로고침해주세요.</p>';
}
