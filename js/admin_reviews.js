import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL     = "https://deecrnfbvgbzyybqhywy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8";

// ── Auth guard ──────────────────────────────────────────────────────────────
const sessionToken = localStorage.getItem("sb_admin_session");
if (!sessionToken) window.location.href = "/admin-login.html";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${sessionToken}` } }
});

// Validate session on load; redirect if invalid
supabase.auth.getUser().then(({ error }) => {
  if (error) { localStorage.removeItem("sb_admin_session"); window.location.href = "/admin-login.html"; }
});

// Re-validate every 10 minutes to catch mid-session expiry
setInterval(async () => {
  const { error } = await supabase.auth.getUser();
  if (error) { localStorage.removeItem("sb_admin_session"); window.location.href = "/admin-login.html"; }
}, 10 * 60 * 1000);


// ── Utilities ───────────────────────────────────────────────────────────────

function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${isError ? "error" : "success"}`;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 3000);
}

// Full HTML escape — covers attributes too (" and ')
function esc(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// Pick first non-empty value from an object by a list of candidate keys
function pick(obj, keys, fallback = "—") {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return fallback;
}

// Safe float parse — returns 0 for NaN/null/undefined
function safeFloat(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// Truthy paymentId: non-empty string that isn't literally "null"/"undefined"
function validId(id) {
  return id && id !== "null" && id !== "undefined";
}


// ── Schema column cache ──────────────────────────────────────────────────────
// Detect once at startup; avoids a probe query on every update call.

let _statusCol = null;
let _notesCol  = null;

async function detectOrderColumns() {
  if (_statusCol && _notesCol) return;
  const { data } = await supabase.from("orders").select("*").limit(1);
  const row = data?.[0] ?? {};
  _statusCol = "order_status" in row ? "order_status" : "status";
  _notesCol  = "notes"        in row ? "notes"        : "remark";
}


// ── Supabase: Orders ────────────────────────────────────────────────────────

async function fetchEnrichedOrders() {
  const { data: ordersRaw, error: ordErr } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (ordErr) throw ordErr;
  if (!ordersRaw?.length) return [];

  // Detect which field links an order to a user
  const sampleKeys = Object.keys(ordersRaw[0]).map(k => k.toLowerCase());
  let userIdField = Object.keys(ordersRaw[0]).find(k =>
    k.toLowerCase().includes("user") || k.toLowerCase().includes("customer")
  ) ?? "user_id";

  // Batch-fetch users
  const uniqueUserIds = [...new Set(ordersRaw.map(o => o[userIdField]).filter(Boolean))];
  const usersMap = new Map();
  if (uniqueUserIds.length) {
    const { data: users } = await supabase.from("users").select("*").in("id", uniqueUserIds);
    users?.forEach(u => usersMap.set(u.id, u));
  }

  // Batch-fetch payments
  const orderIds = ordersRaw.map(o => o.id);
  const paymentsMap = new Map();
  if (orderIds.length) {
    const { data: payments } = await supabase
      .from("payments")
      .select("id, order_id, total_amount, advance_paid, due_amount")
      .in("order_id", orderIds);
    payments?.forEach(p => paymentsMap.set(p.order_id, p));
  }

  return ordersRaw.map(order => {
    const user    = usersMap.get(order[userIdField]) ?? {};
    const payment = paymentsMap.get(order.id) ?? {};

    const totalAmount   = safeFloat(payment.total_amount);
    const advanceAmount = safeFloat(payment.advance_paid);
    // Use DB due_amount when present; calculate as fallback
    const dueAmount = payment.due_amount != null
      ? safeFloat(payment.due_amount)
      : Math.max(0, totalAmount - advanceAmount);

    return {
      id:               order.id,
      order_id:         order.order_id ?? `ORD-${order.id}`,
      order_date:       order.created_at,
      customer_name:    pick(user,  ["full_name","name","fullname"]),
      city:             pick(user,  ["city","city_name","town","location"], null) ??
                        pick(order, ["delivery_city","shipping_city","city"]),
      delivery_address: pick(user,  ["delivery_address","address","street_address"], null) ??
                        pick(order, ["delivery_address","shipping_address","address"]),
      status:           order.order_status ?? order.status ?? "pending",
      remark:           order.notes ?? order.remark ?? "",
      total_amount:     totalAmount,
      advance_paid:     advanceAmount,
      due:              dueAmount,
      _paymentId:       payment.id ?? null,    // null means no payment row yet → INSERT
    };
  });
}


async function updateOrderStatus(orderId, newStatus) {
  await detectOrderColumns();
  const { error } = await supabase
    .from("orders")
    .update({ [_statusCol]: newStatus, last_updated: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}


async function updateOrderRemark(orderId, remark) {
  await detectOrderColumns();
  const { error } = await supabase
    .from("orders")
    .update({ [_notesCol]: remark, last_updated: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}

// paymentId: real DB id (number/uuid) → UPDATE; null → INSERT new row
async function savePayment(orderId, totalAmount, advancePaid, paymentId) {
  const dueAmount = Math.max(0, totalAmount - advancePaid);
  const now = new Date().toISOString();

  if (validId(paymentId)) {
    // UPDATE existing payment row
    const { error } = await supabase
      .from("payments")
      .update({ total_amount: totalAmount, advance_paid: advancePaid, due_amount: dueAmount, updated_at: now })
      .eq("id", paymentId);
    if (error) throw error;
  } else {
    // INSERT new payment row — first check if one already exists for this order
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existing?.id) {
      // Race condition: row was created after we fetched — update it
      const { error } = await supabase
        .from("payments")
        .update({ total_amount: totalAmount, advance_paid: advancePaid, due_amount: dueAmount, updated_at: now })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("payments")
        .insert({ order_id: orderId, total_amount: totalAmount, advance_paid: advancePaid, due_amount: dueAmount, created_at: now, updated_at: now });
      if (error) throw error;
    }
  }
}

//UPDATE PAYMENT
async function updatePayment(orderId) {

  const advance = Number(document.getElementById("advance_paid").value);
  const status = document.getElementById("status").value;

  // get current payment
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .single();

  const newDue = payment.final_total - advance;

  const { error } = await supabase
    .from("payments")
    .update({
      advance_paid: advance,
      due_amount: newDue,
      payment_status: status
    })
    .eq("order_id", orderId);

  if (!error) {
    alert("Payment updated");
  }
}


// ── Supabase: Quotations ────────────────────────────────────────────────────

async function insertQuotation({ orderId, productPrice, shippingFee, serviceFee, deliveryFee }) {
  const totalAmount = productPrice + shippingFee + serviceFee + deliveryFee;
  const now = new Date().toISOString();

  const { error } = await supabase.from("quotations").insert({
    order_id:      orderId,
    product_price: productPrice,
    shipping_fee:  shippingFee,
    service_fee:   serviceFee,
    delivery_fee:  deliveryFee,
    total_amount:  totalAmount,
    status:        "Sent",
    created_at:    now,
  });
  if (error) throw error;

  // Update order status via cached column name
  await detectOrderColumns();
  await supabase
    .from("orders")
    .update({ [_statusCol]: "Quotation Sent" })
    .eq("id", orderId);
}

async function fetchQuotations() {
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}


// ── Supabase: Reviews ───────────────────────────────────────────────────────

async function fetchReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}


// ══════════════════════════════════════════════════════════════════════════════
// UI STATE
// ══════════════════════════════════════════════════════════════════════════════

// ── Orders state ─────────────────────────────────────────────────────────────
let masterOrders   = [];
let filteredOrders = [];
let ordersPage     = 1;
let ordersPageSize = 25;

async function reloadOrdersAndRender() {
  document.getElementById("orders-body").innerHTML =
    `<tr><td colspan="11" style="text-align:center"><span class="loading-spinner"></span> Loading…</td></tr>`;
  try {
    masterOrders = await fetchEnrichedOrders();
    applyOrderSearchAndRender();
  } catch (err) {
    document.getElementById("orders-body").innerHTML =
      `<tr><td colspan="11">⚠️ ${esc(err.message)}</td></tr>`;
    showToast(err.message, true);
  }
}

function applyOrderSearchAndRender() {
  const term = (document.getElementById("order-search")?.value ?? "").toLowerCase().trim();
  filteredOrders = term
    ? masterOrders.filter(o =>
        (o.order_id       ?? "").toLowerCase().includes(term) ||
        (o.customer_name  ?? "").toLowerCase().includes(term) ||
        (o.city           ?? "").toLowerCase().includes(term)
      )
    : [...masterOrders];
  ordersPage = 1;
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById("orders-body");
  if (!tbody) return;
  const start    = (ordersPage - 1) * ordersPageSize;
  const pageData = filteredOrders.slice(start, start + ordersPageSize);

  if (!pageData.length) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center">📭 No orders found</td></tr>`;
    renderOrdersPagination();
    return;
  }

  tbody.innerHTML = "";
  for (const o of pageData) {
    const statusClass   = `status-${(o.status ?? "pending").toLowerCase().replace(/\s+/g, "-")}`;
    const formattedDate = o.order_date ? new Date(o.order_date).toLocaleDateString("en-IN") : "—";
    // paymentId as data-attribute: always stringify; we validate with validId() on read
    const pid = o._paymentId ?? "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${esc(o.order_id)}</strong></td>
      <td>${formattedDate}</td>
      <td>${esc(o.customer_name)}</td>
      <td>${esc(o.city)}</td>
      <td>${esc(o.delivery_address)}</td>
      <td><span class="status-badge ${statusClass}">${esc(o.status)}</span></td>

      <!-- Total amount cell -->
      <td>
        <div class="payment-cell">
          <input type="number" class="table-input order-total-input"
            data-order-id="${esc(o.id)}"
            value="${o.total_amount}" min="0" step="any">
        </div>
      </td>

      <!-- Advance paid cell -->
      <td>
        <div class="payment-cell">
          <input type="number" class="table-input order-advance-input"
            data-order-id="${esc(o.id)}"
            value="${o.advance_paid}" min="0" step="any">
        </div>
      </td>

      <!-- Due (read-only, recalculated on save) -->
      <td class="due-cell">${o.due.toFixed(2)}</td>

      <!-- Remark -->
      <td class="remark-cell">
        <span class="remark-text">${esc(o.remark)}</span>
        <button class="btn-tiny remark-edit-btn"
          data-order-id="${esc(o.id)}"
          data-remark="${esc(o.remark)}">✏️ Edit</button>
      </td>

      <!-- Actions column -->
      <td>
        <div class="action-cell">
          <!-- Status update -->
          <select class="status-select" data-order-id="${esc(o.id)}">
            ${["pending","ordered","purchased","shipped","jaigaon","phuentsholing","delivery","delivered"]
              .map(s => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`)
              .join("")}
          </select>
          <button class="btn save-status-btn" data-order-id="${esc(o.id)}">Update Status</button>

          <!-- Payment save -->
          <button class="btn save-payment-btn"
            data-order-id="${esc(o.id)}"
            data-payment-id="${esc(pid)}">💾 Save Payment</button>

          <!-- Quotation -->
          <button class="btn btn-secondary create-quotation-btn"
            data-order-id="${esc(o.id)}">📄 Quotation</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }
  attachOrderEvents();
  renderOrdersPagination();
}

function attachOrderEvents() {
  // Use event delegation approach: removeEventListener then re-add
  const attach = (sel, evName, fn) => {
    document.querySelectorAll(sel).forEach(el => {
      el.removeEventListener(evName, fn);
      el.addEventListener(evName, fn);
    });
  };
  attach(".save-status-btn",      "click", handleStatusUpdate);
  attach(".save-payment-btn",     "click", handlePaymentSave);
  attach(".remark-edit-btn",      "click", handleRemarkEdit);
  attach(".create-quotation-btn", "click", handleOpenQuotationModal);
}

async function handleStatusUpdate(e) {
  const btn     = e.currentTarget;
  const orderId = btn.dataset.orderId;
  const row     = btn.closest("tr");
  const status  = row.querySelector(".status-select").value;
  btn.disabled  = true;
  try {
    await updateOrderStatus(orderId, status);
    showToast(`Status updated → ${status}`);
    await reloadOrdersAndRender();
  } catch (err) {
    showToast(`Error: ${err.message}`, true);
    btn.disabled = false;
  }
}

async function handlePaymentSave(e) {
  const btn       = e.currentTarget;
  const orderId   = btn.dataset.orderId;
  const paymentId = btn.dataset.paymentId;   // may be ""  → validId() handles it
  const row       = btn.closest("tr");

  const totalInput   = row.querySelector(".order-total-input");
  const advanceInput = row.querySelector(".order-advance-input");
  const total        = safeFloat(totalInput?.value);
  const advance      = safeFloat(advanceInput?.value);

  if (advance > total) {
    showToast("Advance cannot exceed total amount", true);
    return;
  }

  btn.disabled = true;
  try {
    await savePayment(orderId, total, advance, paymentId);
    showToast("Payment saved ✓");
    await reloadOrdersAndRender();
  } catch (err) {
    showToast(`Payment error: ${err.message}`, true);
    btn.disabled = false;
  }
}

async function handleRemarkEdit(e) {
  const btn     = e.currentTarget;
  const orderId = btn.dataset.orderId;
  const current = btn.dataset.remark ?? "";
  const updated = prompt("Edit remark:", current);
  if (updated === null) return;   // cancelled
  try {
    await updateOrderRemark(orderId, updated.trim());
    showToast("Remark saved");
    await reloadOrdersAndRender();
  } catch (err) {
    showToast(err.message, true);
  }
}

function handleOpenQuotationModal(e) {
  openQuotationModal(e.currentTarget.dataset.orderId);
}

function renderOrdersPagination() {
  const container = document.getElementById("orders-pagination");
  if (!container) return;
  const total = Math.ceil(filteredOrders.length / ordersPageSize) || 1;
  container.innerHTML = `
    <button id="orders-prev-btn" ${ordersPage <= 1 ? "disabled" : ""}>◀ Prev</button>
    <span>Page ${ordersPage} of ${total} (${filteredOrders.length} orders)</span>
    <button id="orders-next-btn" ${ordersPage >= total ? "disabled" : ""}>Next ▶</button>
    <span style="margin-left:10px">Jump:
      <input type="number" id="orders-goto-page" min="1" max="${total}" style="width:60px">
    </span>
  `;
  document.getElementById("orders-prev-btn").addEventListener("click", () => {
    if (ordersPage > 1) { ordersPage--; renderOrdersTable(); }
  });
  document.getElementById("orders-next-btn").addEventListener("click", () => {
    if (ordersPage < total) { ordersPage++; renderOrdersTable(); }
  });
  document.getElementById("orders-goto-page").addEventListener("keypress", ev => {
    if (ev.key === "Enter") {
      const p = parseInt(ev.target.value);
      if (p >= 1 && p <= total) { ordersPage = p; renderOrdersTable(); }
    }
  });
}

function exportOrdersCSV() {
  downloadCSV(filteredOrders.map(o => ({
    "Order ID":          o.order_id,
    "Date":              o.order_date ? new Date(o.order_date).toLocaleDateString("en-IN") : "",
    "Customer":          o.customer_name,
    "City":              o.city,
    "Delivery Address":  o.delivery_address,
    "Status":            o.status,
    "Total (₹)":         o.total_amount,
    "Advance (₹)":       o.advance_paid,
    "Due (₹)":           o.due,
    "Remark":            o.remark,
  })), "shop2bhutan_orders.csv");
}


// ── Quotation Modal ──────────────────────────────────────────────────────────

let _quotationOrderId = null;

function openQuotationModal(orderId) {
  _quotationOrderId = orderId;
  document.getElementById("modal-order-id-display").textContent = orderId;
  ["modal-product-price","modal-shipping-fee","modal-service-fee","modal-delivery-fee"]
    .forEach(id => { document.getElementById(id).value = ""; });
  updateModalTotal();
  document.getElementById("quotationModal").classList.add("open");
}

function closeQuotationModal() {
  _quotationOrderId = null;
  document.getElementById("quotationModal").classList.remove("open");
}

function updateModalTotal() {
  const pp = safeFloat(document.getElementById("modal-product-price")?.value);
  const sf = safeFloat(document.getElementById("modal-shipping-fee")?.value);
  const sv = safeFloat(document.getElementById("modal-service-fee")?.value);
  const df = safeFloat(document.getElementById("modal-delivery-fee")?.value);
  const total = pp + sf + sv + df;
  const display = document.getElementById("modal-total-display");
  if (display) display.textContent = `Total: ₹${total.toFixed(2)}`;
}

async function handleSaveQuotation() {
  if (!_quotationOrderId) return;

  const productPrice = safeFloat(document.getElementById("modal-product-price").value);
  const shippingFee  = safeFloat(document.getElementById("modal-shipping-fee").value);
  const serviceFee   = safeFloat(document.getElementById("modal-service-fee").value);
  const deliveryFee  = safeFloat(document.getElementById("modal-delivery-fee").value);

  if (productPrice <= 0) {
    showToast("Product price must be greater than 0", true);
    return;
  }

  const saveBtn = document.getElementById("modal-save-quotation-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    await insertQuotation({
      orderId: _quotationOrderId,
      productPrice,
      shippingFee,
      serviceFee,
      deliveryFee,
    });
    showToast("Quotation created ✓");
    closeQuotationModal();
    // Refresh both tabs so data is current
    await reloadOrdersAndRender();
    await reloadQuotationsAndRender();
  } catch (err) {
    showToast(`Quotation error: ${err.message}`, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Quotation";
  }
}


// ── Quotations section ───────────────────────────────────────────────────────

let allQuotations     = [];
let quotationsPage    = 1;
const QUOT_PAGE_SIZE  = 10;

async function reloadQuotationsAndRender() {
  const tbody = document.getElementById("quotations-body");
  if (tbody) tbody.innerHTML =
    `<tr><td colspan="9" style="text-align:center"><span class="loading-spinner"></span> Loading…</td></tr>`;
  try {
    allQuotations  = await fetchQuotations();
    quotationsPage = 1;
    renderQuotationsTable();
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="9">⚠️ ${esc(err.message)}</td></tr>`;
    showToast(err.message, true);
  }
}

function renderQuotationsTable() {
  const tbody = document.getElementById("quotations-body");
  if (!tbody) return;

  const start    = (quotationsPage - 1) * QUOT_PAGE_SIZE;
  const pageData = allQuotations.slice(start, start + QUOT_PAGE_SIZE);

  if (!pageData.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">📭 No quotations yet</td></tr>`;
    renderQuotationsPagination();
    return;
  }

  tbody.innerHTML = "";
  for (const q of pageData) {
    const total = safeFloat(q.total_amount) ||
      (safeFloat(q.product_price) + safeFloat(q.shipping_fee) +
       safeFloat(q.service_fee)   + safeFloat(q.delivery_fee));
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(q.id)}</td>
      <td>${esc(q.order_id)}</td>
      <td>₹${safeFloat(q.product_price).toFixed(2)}</td>
      <td>₹${safeFloat(q.shipping_fee).toFixed(2)}</td>
      <td>₹${safeFloat(q.service_fee).toFixed(2)}</td>
      <td>₹${safeFloat(q.delivery_fee).toFixed(2)}</td>
      <td><strong>₹${total.toFixed(2)}</strong></td>
      <td><span class="status-badge">${esc(q.status ?? "—")}</span></td>
      <td>${q.created_at ? new Date(q.created_at).toLocaleDateString("en-IN") : "—"}</td>
    `;
    tbody.appendChild(tr);
  }
  renderQuotationsPagination();
}

function renderQuotationsPagination() {
  const container = document.getElementById("quotations-pagination");
  if (!container) return;
  const total = Math.ceil(allQuotations.length / QUOT_PAGE_SIZE) || 1;
  container.innerHTML = `
    <button id="quot-prev-btn" ${quotationsPage <= 1 ? "disabled" : ""}>◀ Prev</button>
    <span>Page ${quotationsPage} of ${total} (${allQuotations.length} quotations)</span>
    <button id="quot-next-btn" ${quotationsPage >= total ? "disabled" : ""}>Next ▶</button>
  `;
  document.getElementById("quot-prev-btn").addEventListener("click", () => {
    if (quotationsPage > 1) { quotationsPage--; renderQuotationsTable(); }
  });
  document.getElementById("quot-next-btn").addEventListener("click", () => {
    if (quotationsPage < total) { quotationsPage++; renderQuotationsTable(); }
  });
}

function exportQuotationsCSV() {
  if (!allQuotations.length) { showToast("No data to export", true); return; }
  downloadCSV(allQuotations.map(q => ({
    "Quotation ID":    q.id,
    "Order ID":        q.order_id,
    "Product Price":   q.product_price,
    "Shipping Fee":    q.shipping_fee,
    "Service Fee":     q.service_fee,
    "Delivery Fee":    q.delivery_fee,
    "Total Amount":    q.total_amount,
    "Status":          q.status,
    "Created At":      q.created_at,
  })), "shop2bhutan_quotations.csv");
}


// ── Reviews section ──────────────────────────────────────────────────────────

let allReviews        = [];
let reviewsFiltered   = [];
let reviewsPage       = 1;
let reviewsPageSize   = 12;

async function reloadReviewsAndRender() {
  try {
    allReviews = await fetchReviews();
    applyReviewFilterAndRender();
  } catch (err) {
    document.getElementById("reviews-container").innerHTML =
      `<p style="color:red">⚠️ ${esc(err.message)}</p>`;
    showToast(err.message, true);
  }
}

// Local filter — no DB call on each keystroke
function applyReviewFilterAndRender() {
  const search = (document.getElementById("review-search")?.value ?? "").toLowerCase().trim();
  const filter = document.getElementById("review-filter")?.value ?? "all";

  reviewsFiltered = allReviews.filter(r => {
    const nameMatch = !search || (r.full_name ?? "").toLowerCase().includes(search);
    const statusMatch =
      filter === "approved" ? r.is_approved === true :
      filter === "pending"  ? !r.is_approved :
      true;
    return nameMatch && statusMatch;
  });
  reviewsPage = 1;
  renderReviewsGrid();
}

function renderReviewsGrid() {
  const container = document.getElementById("reviews-container");
  if (!container) return;

  const start    = (reviewsPage - 1) * reviewsPageSize;
  const pageData = reviewsFiltered.slice(start, start + reviewsPageSize);

  if (!pageData.length) {
    container.innerHTML = "<p>✨ No reviews found.</p>";
    renderReviewsPagination();
    return;
  }

  container.innerHTML = "";
  for (const r of pageData) {
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
      <h3>${esc(r.full_name || "Anonymous")}</h3>
      <div class="review-meta">
        📅 ${r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
        &nbsp;•&nbsp; ⭐ ${r.rating ?? "?"}/5
      </div>
      <p>${esc(r.message ?? r.comment ?? "")}</p>
      <div class="review-actions">
        <button class="approve-btn ${r.is_approved ? "approved" : "pending"}"
          data-review-id="${esc(r.id)}"
          data-approved="${!!r.is_approved}">
          ${r.is_approved ? "✅ Approved" : "⏳ Approve"}
        </button>
        <button class="delete-btn" data-review-id="${esc(r.id)}">🗑️ Delete</button>
      </div>
    `;
    container.appendChild(card);
  }
  attachReviewEvents();
  renderReviewsPagination();
}

function attachReviewEvents() {
  document.querySelectorAll(".approve-btn").forEach(btn => {
    btn.removeEventListener("click", handleApprove);
    btn.addEventListener("click", handleApprove);
  });
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.removeEventListener("click", handleDelete);
    btn.addEventListener("click", handleDelete);
  });
}

async function handleApprove(e) {
  const btn     = e.currentTarget;
  const id      = btn.dataset.reviewId;
  const current = btn.dataset.approved === "true";
  btn.disabled  = true;
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: !current })
    .eq("id", id);
  if (error) { showToast("Update failed", true); btn.disabled = false; }
  else { showToast("Review status updated"); await reloadReviewsAndRender(); }
}

async function handleDelete(e) {
  if (!confirm("Delete this review permanently?")) return;
  const btn = e.currentTarget;
  const id  = btn.dataset.reviewId;
  btn.disabled = true;
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) { showToast("Delete failed", true); btn.disabled = false; }
  else { showToast("Review deleted"); await reloadReviewsAndRender(); }
}

function renderReviewsPagination() {
  const container = document.getElementById("reviews-pagination");
  if (!container) return;
  const total = Math.ceil(reviewsFiltered.length / reviewsPageSize) || 1;
  container.innerHTML = `
    <button id="reviews-prev-btn" ${reviewsPage <= 1 ? "disabled" : ""}>◀ Prev</button>
    <span>Page ${reviewsPage} of ${total}</span>
    <button id="reviews-next-btn" ${reviewsPage >= total ? "disabled" : ""}>Next ▶</button>
  `;
  document.getElementById("reviews-prev-btn").addEventListener("click", () => {
    if (reviewsPage > 1) { reviewsPage--; renderReviewsGrid(); }
  });
  document.getElementById("reviews-next-btn").addEventListener("click", () => {
    if (reviewsPage < total) { reviewsPage++; renderReviewsGrid(); }
  });
}

// Export only what is currently filtered/visible
function exportReviewsCSV() {
  downloadCSV(reviewsFiltered.map(r => ({
    "Name":     r.full_name,
    "Rating":   r.rating,
    "Message":  r.message ?? r.comment,
    "Approved": r.is_approved ? "Yes" : "No",
    "Created":  r.created_at,
  })), "shop2bhutan_reviews.csv");
}


// ── CSV download ─────────────────────────────────────────────────────────────

function downloadCSV(data, filename) {
  if (!data.length) { showToast("No data to export", true); return; }
  const headers = Object.keys(data[0]);
  const rows    = [headers.join(",")];
  for (const row of data) {
    rows.push(headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(`Exported ${data.length} records`);
}


// ── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(`${tab}-tab`).classList.add("active");
  document.getElementById("orders-section").style.display     = tab === "orders"     ? "block" : "none";
  document.getElementById("reviews-section").style.display    = tab === "reviews"    ? "block" : "none";
  document.getElementById("quotations-section").style.display = tab === "quotations" ? "block" : "none";
  if (tab === "orders")     reloadOrdersAndRender();
  if (tab === "reviews")    reloadReviewsAndRender();
  if (tab === "quotations") reloadQuotationsAndRender();
}


// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  // Detect order schema columns once before anything else
  await detectOrderColumns();

  // ── Tabs
  document.getElementById("orders-tab")    .addEventListener("click", () => switchTab("orders"));
  document.getElementById("reviews-tab")   .addEventListener("click", () => switchTab("reviews"));
  document.getElementById("quotations-tab").addEventListener("click", () => switchTab("quotations"));

  // ── Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    if (!confirm("Logout?")) return;
    await supabase.auth.signOut();
    localStorage.removeItem("sb_admin_session");
    window.location.href = "/admin-login.html";
  });

  // ── Orders controls
  document.getElementById("order-search")
    .addEventListener("input", () => applyOrderSearchAndRender());
  document.getElementById("orders-refresh-btn")
    .addEventListener("click", () => reloadOrdersAndRender());
  document.getElementById("orders-page-size")
    .addEventListener("change", e => {
      ordersPageSize = parseInt(e.target.value);
      ordersPage = 1;
      renderOrdersTable();
    });
  document.getElementById("export-orders-btn")
    .addEventListener("click", () => exportOrdersCSV());

  // ── Reviews controls
  document.getElementById("review-search")
    .addEventListener("input", () => applyReviewFilterAndRender());
  document.getElementById("review-filter")
    .addEventListener("change", () => applyReviewFilterAndRender());
  document.getElementById("reviews-refresh-btn")
    .addEventListener("click", () => reloadReviewsAndRender());
  document.getElementById("reviews-page-size")
    .addEventListener("change", e => {
      reviewsPageSize = parseInt(e.target.value);
      reviewsPage = 1;
      renderReviewsGrid();
    });
  document.getElementById("export-reviews-btn")
    .addEventListener("click", () => exportReviewsCSV());

  // ── Quotations controls
  document.getElementById("refresh-quotations-btn")
    .addEventListener("click", () => reloadQuotationsAndRender());
  document.getElementById("export-quotations-btn")
    .addEventListener("click", () => exportQuotationsCSV());

  // ── Quotation modal
  document.getElementById("modal-save-quotation-btn")
    .addEventListener("click", () => handleSaveQuotation());
  document.getElementById("modal-cancel-btn")
    .addEventListener("click", () => closeQuotationModal());

  // Live total preview as user types
  ["modal-product-price","modal-shipping-fee","modal-service-fee","modal-delivery-fee"]
    .forEach(id => document.getElementById(id).addEventListener("input", updateModalTotal));

  // Close modal on backdrop click
  document.getElementById("quotationModal").addEventListener("click", e => {
    if (e.target === e.currentTarget) closeQuotationModal();
  });

  // ── Initial load (orders is the default visible tab)
  reloadOrdersAndRender();
  // Pre-load reviews in background so switching is instant
  fetchReviews().then(data => { allReviews = data; }).catch(() => {});
});