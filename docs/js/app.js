/* ==========================================================================
   100% Juice — shared app logic
   Plain vanilla JS. No frameworks, no build step.
   Handles: sidebar nav, cart state (localStorage), product grid rendering,
   cart rendering, and the pickup-only checkout flow.
   Loaded on every page. products-data.js is loaded separately on the
   products page (defines the global `PRODUCTS`).
   ========================================================================== */

/* --------------------------------------------------------------------------
   localStorage keys
   -------------------------------------------------------------------------- */
const CART_KEY = "juice-cart";     // { "<uuid>": quantity, ... }
const ORDERS_KEY = "juice-orders"; // [ { ...order }, ... ] for a future backend

/* --------------------------------------------------------------------------
   Tiny storage helpers
   -------------------------------------------------------------------------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    /* storage might be full or disabled — fail quietly for a static site */
  }
}

/* Cart: a map of uuid -> quantity */
function getCart() {
  return readJSON(CART_KEY, {});
}
function setCart(cart) {
  writeJSON(CART_KEY, cart);
  updateCartCount();
}

/* Save an order locally so a real backend can be wired up later.
   NOTE: this is where a real order endpoint would go — e.g.
   fetch("/api/orders", { method: "POST", body: JSON.stringify(order) })
   For now we only persist to localStorage (see ORDERS_KEY). */
function saveOrder(order) {
  const orders = readJSON(ORDERS_KEY, []);
  orders.push(order);
  writeJSON(ORDERS_KEY, orders);
}

/* --------------------------------------------------------------------------
   Price helpers
   -------------------------------------------------------------------------- */
function priceToNumber(priceStr) {
  const n = parseFloat(String(priceStr || "").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}
function formatMoney(n) {
  return "$" + n.toFixed(2).replace(/\.00$/, "");
}

/* --------------------------------------------------------------------------
   Sidebar navigation
   -------------------------------------------------------------------------- */
function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const openBtn = document.getElementById("hamburger");
  const closeBtn = document.getElementById("sidebar-close");
  if (!sidebar || !overlay) return;

  function open() {
    sidebar.classList.add("open");
    overlay.classList.add("open");
  }
  function close() {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
  }

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close); // tap the overlay to close
  // Close when the user picks a destination
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* --------------------------------------------------------------------------
   Cart badge (top-right on every page)
   -------------------------------------------------------------------------- */
function cartCount() {
  const cart = getCart();
  return Object.values(cart).reduce((sum, q) => sum + q, 0);
}

function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (el) el.textContent = String(cartCount());
}

/* --------------------------------------------------------------------------
   Product grid (products page only)
   -------------------------------------------------------------------------- */
function productByUuid(uuid) {
  if (typeof PRODUCTS === "undefined") return null;
  return PRODUCTS.find((p) => p.uuid === uuid) || null;
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid || typeof PRODUCTS === "undefined") return;

  grid.innerHTML = "";
  PRODUCTS.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-img"><img src="${p.img}" alt="${escapeHtml(p.displayName)}" loading="lazy"></div>
      <h3 class="card-name">${escapeHtml(p.displayName)}</h3>
      <p class="card-desc">${escapeHtml(p.description)}</p>
      <div class="card-meta">
        <span class="card-size">${escapeHtml(p.size)}</span>
        <span class="card-price">${escapeHtml(p.price)}</span>
      </div>
      <button class="btn" type="button">Add to cart</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      addToCart(p.uuid);
    });
    grid.appendChild(card);
  });
}

/* --------------------------------------------------------------------------
   Cart rendering
   -------------------------------------------------------------------------- */
function addToCart(uuid) {
  const cart = getCart();
  cart[uuid] = (cart[uuid] || 0) + 1;
  setCart(cart);
  renderCart();
}

function setQty(uuid, qty) {
  const cart = getCart();
  if (qty <= 0) {
    delete cart[uuid];
  } else {
    cart[uuid] = qty;
  }
  setCart(cart);
  renderCart();
}

function cartTotal() {
  const cart = getCart();
  let total = 0;
  Object.keys(cart).forEach((uuid) => {
    const p = productByUuid(uuid);
    if (p) total += priceToNumber(p.price) * cart[uuid];
  });
  return total;
}

function renderCart() {
  const list = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  if (!list) return;

  const cart = getCart();
  const uuids = Object.keys(cart).filter((u) => cart[u] > 0);
  list.innerHTML = "";

  if (uuids.length === 0) {
    list.innerHTML = `<p class="cart-empty">Your cart is empty — add some juicy stickers above!</p>`;
  } else {
    uuids.forEach((uuid) => {
      const p = productByUuid(uuid) || { displayName: uuid, price: "$0", size: "", img: "" };
      const qty = cart[uuid];
      const line = document.createElement("div");
      line.className = "cart-line";
      line.innerHTML = `
        <img src="${p.img}" alt="${escapeHtml(p.displayName)}">
        <div class="cart-info">
          <div class="cart-name">${escapeHtml(p.displayName)}</div>
          <div class="cart-sub">${escapeHtml(p.size)} &middot; ${escapeHtml(p.price)} each</div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" type="button" data-act="dec" aria-label="Decrease quantity">&minus;</button>
          <span class="qty-value">${qty}</span>
          <button class="qty-btn" type="button" data-act="inc" aria-label="Increase quantity">+</button>
        </div>
        <button class="remove-btn" type="button" data-act="rm">Remove</button>
      `;
      line.querySelector('[data-act="dec"]').addEventListener("click", () => setQty(uuid, qty - 1));
      line.querySelector('[data-act="inc"]').addEventListener("click", () => setQty(uuid, qty + 1));
      line.querySelector('[data-act="rm"]').addEventListener("click", () => setQty(uuid, 0));
      list.appendChild(line);
    });
  }

  if (totalEl) totalEl.textContent = "Total: " + formatMoney(cartTotal());
}

/* --------------------------------------------------------------------------
   Checkout: fulfillment + the un-clickable "Ship to me" button
   -------------------------------------------------------------------------- */
let selectedFulfillment = null; // only ever becomes "pickup"

function initShipButton() {
  const overlay = document.getElementById("escape-arena");
  const ship = document.getElementById("ship-btn");
  const tauntEl = document.getElementById("ship-taunt");
  const notice = document.getElementById("checkout-notice");
  if (!overlay || !ship) return;

  // The invisible overlay covers the whole checkout card; `card` is what the
  // pointer dodge listens on (the overlay is pointer-events:none and never
  // receives pointer events itself).
  const card = overlay.closest(".checkout") || overlay.parentElement;
  const pickup = document.getElementById("pickup-btn");
  if (!card) return;

  const MARGIN = 10;    // px — keeps the button inside the card edges
  const REST_GAP = 16;  // px — gap between Local pickup and the resting Ship button
  const NEAR = 80;      // px — how close the pointer has to get before it flees
  const messages = ["whoa!", "slippery!", "try again!", "nope!", "too slow!", "catch me!"];
  let msgIdx = 0;
  let cooling = false;

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function place(x, y, duration) {
    ship.style.transition = duration ? `left ${duration}ms ease, top ${duration}ms ease` : "none";
    ship.style.left = x + "px";
    ship.style.top = y + "px";
    ship.style.visibility = "visible"; // unhide once we've placed it at rest
  }
  function maxX() { return Math.max(MARGIN, overlay.clientWidth - ship.offsetWidth - MARGIN); }
  function maxY() { return Math.max(MARGIN, overlay.clientHeight - ship.offsetHeight - MARGIN); }

  // Rest position: flush right of Local pickup, on the same row and vertically
  // centred (so the pair reads as a normal side-by-side choice). If there's no
  // room to the right — the narrow/stacked layout — park it just below pickup.
  function restXY() {
    const o = overlay.getBoundingClientRect();
    let x = MARGIN;
    let y = MARGIN;
    if (pickup) {
      const p = pickup.getBoundingClientRect();
      x = p.right - o.left + REST_GAP;
      y = p.top - o.top + (p.height - ship.offsetHeight) / 2;
      if (x > maxX()) {
        x = (o.width - ship.offsetWidth) / 2;
        y = p.bottom - o.top + REST_GAP;
      }
    }
    return { x: clamp(x, MARGIN, maxX()), y: clamp(y, MARGIN, maxY()) };
  }
  function rest(duration) {
    const home = restXY();
    place(home.x, home.y, duration);
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function taunt() {
    if (tauntEl) { tauntEl.textContent = messages[msgIdx % messages.length]; msgIdx += 1; }
  }

  function escape() {
    if (cooling) return;
    cooling = true;
    setTimeout(() => { cooling = false; }, 150);
    if (Math.random() < 1 / 6) {
      // Occasionally drift slowly back to rest so people keep trying.
      rest(1200);
    } else {
      place(rand(MARGIN, maxX()), rand(MARGIN, maxY()), 110);
      taunt();
    }
  }

  // Start at rest, level with Local pickup.
  rest(0);

  // If the card resizes (window resize / responsive breakpoint), keep the
  // button inside the new bounds instead of letting it escape the card.
  window.addEventListener("resize", () => {
    const x = clamp(ship.offsetLeft, MARGIN, maxX());
    const y = clamp(ship.offsetTop, MARGIN, maxY());
    place(x, y, 0);
  });

  // Flee when the pointer gets near (within ~80px). Listening on the card lets
  // the dodge work across the whole checkout area, even where the invisible
  // overlay has no pointer events.
  card.addEventListener("pointermove", (e) => {
    const r = ship.getBoundingClientRect();
    const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    if (dist < NEAR) escape();
  });
  ship.addEventListener("pointerenter", escape);

  // Touch: hop away before the tap can register.
  ship.addEventListener("touchstart", (e) => {
    e.preventDefault();
    escape();
  }, { passive: false });

  // If someone actually manages it (keyboard focus + Enter, or an edge case),
  // fake them out and DON'T select shipping.
  ship.addEventListener("click", (e) => {
    e.preventDefault();
    if (notice) notice.textContent = "Just kidding, shipping isn't ready yet — local pickup only!";
  });
}

function initFulfillment() {
  const pickup = document.getElementById("pickup-btn");
  if (!pickup) return;
  pickup.addEventListener("click", () => {
    selectedFulfillment = "pickup";
    pickup.classList.add("selected");
    const notice = document.getElementById("checkout-notice");
    if (notice) notice.textContent = "Local pickup selected. Nice choice!";
  });
}

/* --------------------------------------------------------------------------
   Order submission (no server — friendly confirmation + mailto)
   -------------------------------------------------------------------------- */
function buildOrderText(order) {
  const lines = [];
  lines.push("100% Juice order");
  lines.push("");
  order.items.forEach((it) => {
    lines.push(`${it.qty} x ${it.name} (${it.size}) — ${it.price}`);
  });
  lines.push("");
  lines.push("Total: " + order.total);
  lines.push("Name: " + order.name);
  lines.push("Fulfillment: Local pickup");
  return lines.join("\n");
}

function renderConfirmation(order) {
  const wrap = document.getElementById("order-confirm");
  if (!wrap) return;
  const text = buildOrderText(order);
  const subject = encodeURIComponent("100% Juice order from " + order.name);
  const body = encodeURIComponent(text);
  wrap.innerHTML = `
    <div class="confirm">
      <h3>Order placed! 🧃</h3>
      <p>Thanks, <strong>${escapeHtml(order.name)}</strong>! Here's what you ordered (pickup only, natch):</p>
      <pre>${escapeHtml(text)}</pre>
      <p>
        <a class="btn btn-yellow" href="mailto:?subject=${subject}&body=${body}">Email this order to Kai</a>
      </p>
    </div>
  `;
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function initOrderForm() {
  const form = document.getElementById("order-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const notice = document.getElementById("checkout-notice");
    const nameInput = document.getElementById("first-name");
    const name = (nameInput && nameInput.value || "").trim();

    if (!name) {
      if (notice) notice.textContent = "Please add a first name so Kai knows who's picking up!";
      if (nameInput) nameInput.focus();
      return;
    }
    if (selectedFulfillment !== "pickup") {
      if (notice) notice.textContent = "Pick 'Local pickup' to continue (shipping isn't ready yet).";
      return;
    }
    const cart = getCart();
    const items = Object.keys(cart)
      .filter((u) => cart[u] > 0)
      .map((u) => {
        const p = productByUuid(u) || { displayName: u, price: "$0", size: "" };
        return { uuid: u, name: p.displayName, size: p.size, price: p.price, qty: cart[u] };
      });
    if (items.length === 0) {
      if (notice) notice.textContent = "Your cart is empty — add a sticker first!";
      return;
    }

    const order = {
      name,
      fulfillment: "pickup",
      items,
      total: formatMoney(cartTotal()),
      createdAt: new Date().toISOString(),
    };

    // Persist locally (swap this for a real endpoint later — see saveOrder notes).
    saveOrder(order);
    renderConfirmation(order);

    // Clear the cart after a successful order.
    setCart({});
    renderCart();
  });
}

/* --------------------------------------------------------------------------
   Small utility
   -------------------------------------------------------------------------- */
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  updateCartCount();
  renderProducts();
  renderCart();
  initShipButton();
  initFulfillment();
  initOrderForm();
});
