import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://deecrnfbvgbzyybqhywy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8";

const sessionToken = localStorage.getItem("sb_admin_session");
if (!sessionToken) window.location.href = "/admin-login.html";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${sessionToken}` } }
});

supabase.auth.getUser().then(({ error }) => {
  if (error) {
    localStorage.removeItem("sb_admin_session");
    window.location.href = "/admin-login.html";
  }
});

function showToast(msg, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${isError ? "error" : "success"}`;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function pick(obj, keys, defaultValue = "—") {
  for (const key of keys) {
    const val = obj[key];
    if (val && typeof val === 'string' && val.trim()) return val.trim();
    if (val && typeof val !== 'string') return String(val);
  }
  return defaultValue;
}

async function fetchEnrichedOrders() {
  const { data: ordersRaw, error: ordersErr } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (ordersErr) throw ordersErr;
  if (!ordersRaw || ordersRaw.length === 0) return [];

  let userIdField = Object.keys(ordersRaw[0]).find(k => k.toLowerCase().includes('user') || k.toLowerCase().includes('customer'));
  if (!userIdField) userIdField = 'user_id';

  const userIds = ordersRaw.map(o => o[userIdField]).filter(Boolean);
  const uniqueUserIds = [...new Set(userIds)];
  let usersMap = new Map();
  if (uniqueUserIds.length) {
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("*")
      .in("id", uniqueUserIds);
    if (!usersErr && users) users.forEach(u => usersMap.set(u.id, u));
  }

  const orderIds = ordersRaw.map(o => o.id);
  let paymentsMap = new Map();
  if (orderIds.length) {
    const { data: payments, error: payErr } = await supabase
      .from("payments")
      .select("order_id, total_amount, advance_paid, due_amount, id")
      .in("order_id", orderIds);
    if (!payErr && payments) payments.forEach(p => paymentsMap.set(p.order_id, p));
  }

  return ordersRaw.map(order => {
    const user = usersMap.get(order[userIdField]) || {};
    const payments = paymentsMap.get(order.id) || { total_amount: 0, advance_paid: 0, due_amount: 0 };

    const customerName = pick(user, ['full_name', 'name', 'fullname'], "—");
    const city = pick(user, ['city', 'city_name', 'town', 'location'], null) ||
                 pick(order, ['delivery_city', 'shipping_city', 'city'], "—");
    const deliveryAddress = pick(user, ['delivery_address', 'address', 'street_address'], null) ||
                            pick(order, ['delivery_address', 'shipping_address', 'address'], "—");

    const orderStatus = order.order_status || order.status || "pending";
    const orderNotes = order.notes || order.remark || "";

    const totalAmount = Number(payments.total_amount) || 0;
    const advanceAmount = Number(payments.advance_paid) || 0;
    const dueAmount = Math.max(0, totalAmount - advanceAmount);

    return {
      id: order.id,
      order_id: order.order_id || `ORD-${order.id}`,
      order_date: order.created_at,
      customer_name: customerName,
      city: city,
      delivery_address: deliveryAddress,
      status: orderStatus,
      total_amount: totalAmount,
      advance_paid: advanceAmount,
      due: dueAmount,
      remark: orderNotes,
      _paymentId: payments?.id || null
    };
  });
}

async function updateOrderStatus(orderId, newStatus) {
  const { data: sample } = await supabase.from("orders").select("*").limit(1);
  let statusCol = sample?.[0]?.hasOwnProperty("order_status") ? "order_status" : "status";
  const { error } = await supabase
    .from("orders")
    .update({ [statusCol]: newStatus, last_updated: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}

async function updateOrderRemark(orderId, newRemark) {
  const { data: sample } = await supabase.from("orders").select("*").limit(1);
  let notesCol = sample?.[0]?.hasOwnProperty("notes") ? "notes" : "remark";
  const { error } = await supabase
    .from("orders")
    .update({ [notesCol]: newRemark, last_updated: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}

// FIXED: always includes due_amount
async function updatePaymentAmounts(orderId, totalAmount, advancePaid, paymentId) {
  const dueAmount = Math.max(0, totalAmount - advancePaid);
  const payload = {
    total_amount: totalAmount,
    advance_paid: advancePaid,
    due_amount: dueAmount,
    updated_at: new Date().toISOString()
  };
  if (paymentId) {
    const { error } = await supabase.from("payments").update(payload).eq("id", paymentId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("payments").insert({
      order_id: orderId,
      total_amount: totalAmount,
      advance_paid: advancePaid,
      due_amount: dueAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  }
}

// ----- orders UI state (abbreviated but functional) -----
let masterOrders = [];
let filteredOrders = [];
let ordersCurrentPage = 1;
let ordersPageSize = 25;

async function reloadOrdersAndRender() {
  try {
    masterOrders = await fetchEnrichedOrders();
    applySearchAndRenderOrders();
  } catch (err) {
    document.getElementById("orders-body").innerHTML = `<tr><td colspan="11">⚠️ ${err.message}</td></tr>`;
    showToast(err.message, true);
  }
}

function filterOrdersClientSide(orders, term) {
  if (!term.trim()) return [...orders];
  const lower = term.toLowerCase();
  return orders.filter(o =>
    (o.order_id || "").toLowerCase().includes(lower) ||
    (o.customer_name || "").toLowerCase().includes(lower) ||
    (o.city || "").toLowerCase().includes(lower)
  );
}

function applySearchAndRenderOrders() {
  const term = document.getElementById("order-search")?.value || "";
  filteredOrders = filterOrdersClientSide(masterOrders, term);
  ordersCurrentPage = 1;
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById("orders-body");
  if (!tbody) return;
  const start = (ordersCurrentPage - 1) * ordersPageSize;
  const pageData = filteredOrders.slice(start, start + ordersPageSize);
  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11">📭 No orders found</td></tr>`;
    renderOrdersPagination();
    return;
  }
  tbody.innerHTML = "";
  for (const order of pageData) {
    const statusClass = `status-${(order.status || "pending").toLowerCase()}`;
    const formattedDate = order.order_date ? new Date(order.order_date).toLocaleDateString("en-IN") : "-";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(order.order_id)}</strong></td>
      <td>${formattedDate}</td>
      <td>${escapeHtml(order.customer_name)}</td>
      <td>${escapeHtml(order.city)}</td>
      <td>${escapeHtml(order.delivery_address)}</td>
      <td><span class="status-badge ${statusClass}">${order.status}</span></td>
      <td><input type="number" class="table-input order-total-input" data-order-id="${order.id}" value="${order.total_amount}" step="any" style="width:100px"> <button class="save-btn save-total-btn" data-order-id="${order.id}" data-payment-id="${order._paymentId || ''}">💾</button></td>
      <td><input type="number" class="table-input order-advance-input" data-order-id="${order.id}" value="${order.advance_paid}" step="any" style="width:100px"> <button class="save-btn save-advance-btn" data-order-id="${order.id}" data-payment-id="${order._paymentId || ''}">💾</button></td>
      <td class="due-cell">${order.due.toFixed(2)}</td>
      <td class="remark-display">${escapeHtml(order.remark)} <button class="remark-edit-btn" data-order-id="${order.id}">✏️ Edit</button></td>
      <td class="action-cell">
        <select class="status-select" data-order-id="${order.id}">
          ${["pending","ordered","purchased","shipped","jaigaon","phuentsholing","delivery","delivered"].map(s => `<option value="${s}" ${order.status === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <button class="save-status-btn" data-order-id="${order.id}">Update</button>
      </td>
    `;
    tbody.appendChild(row);
  }
  attachOrderEvents();
  renderOrdersPagination();
}

function attachOrderEvents() {
  document.querySelectorAll(".save-status-btn").forEach(btn => {
    btn.removeEventListener("click", handleStatusUpdate);
    btn.addEventListener("click", handleStatusUpdate);
  });
  document.querySelectorAll(".remark-edit-btn").forEach(btn => {
    btn.removeEventListener("click", handleRemarkEdit);
    btn.addEventListener("click", handleRemarkEdit);
  });
  document.querySelectorAll(".save-total-btn").forEach(btn => {
    btn.removeEventListener("click", handleTotalSave);
    btn.addEventListener("click", handleTotalSave);
  });
  document.querySelectorAll(".save-advance-btn").forEach(btn => {
    btn.removeEventListener("click", handleAdvanceSave);
    btn.addEventListener("click", handleAdvanceSave);
  });
}

async function handleStatusUpdate(e) {
  const btn = e.currentTarget;
  const orderId = btn.dataset.orderId;
  const row = btn.closest("tr");
  const select = row.querySelector(".status-select");
  const newStatus = select.value;
  try {
    await updateOrderStatus(orderId, newStatus);
    showToast(`Status updated to ${newStatus}`);
    await reloadOrdersAndRender();
  } catch (err) {
    showToast(`Status error: ${err.message}`, true);
  }
}

async function handleRemarkEdit(e) {
  const btn = e.currentTarget;
  const orderId = btn.dataset.orderId;
  const row = btn.closest("tr");
  const remarkSpan = row.querySelector(".remark-display");
  const currentRemark = remarkSpan?.innerText?.replace("✏️ Edit", "").trim() || "";
  const newRemark = prompt("Edit remark (notes):", currentRemark);
  if (newRemark !== null) {
    try {
      await updateOrderRemark(orderId, newRemark.trim());
      showToast("Remark saved");
      await reloadOrdersAndRender();
    } catch (err) { showToast(err.message, true); }
  }
}

async function handleTotalSave(e) {
  const btn = e.currentTarget;
  const orderId = btn.dataset.orderId;
  const paymentId = btn.dataset.paymentId || null;
  const row = btn.closest("tr");
  const totalInput = row.querySelector(".order-total-input");
  const advanceInput = row.querySelector(".order-advance-input");
  let newTotal = parseFloat(totalInput.value);
  let newAdvance = parseFloat(advanceInput.value);
  if (isNaN(newTotal)) newTotal = 0;
  if (isNaN(newAdvance)) newAdvance = 0;
  try {
    await updatePaymentAmounts(orderId, newTotal, newAdvance, paymentId);
    showToast("Total amount updated");
    await reloadOrdersAndRender();
  } catch (err) { showToast(`Update failed: ${err.message}`, true); }
}

async function handleAdvanceSave(e) {
  const btn = e.currentTarget;
  const orderId = btn.dataset.orderId;
  const paymentId = btn.dataset.paymentId || null;
  const row = btn.closest("tr");
  const totalInput = row.querySelector(".order-total-input");
  const advanceInput = row.querySelector(".order-advance-input");
  let newTotal = parseFloat(totalInput.value);
  let newAdvance = parseFloat(advanceInput.value);
  if (isNaN(newTotal)) newTotal = 0;
  if (isNaN(newAdvance)) newAdvance = 0;
  try {
    await updatePaymentAmounts(orderId, newTotal, newAdvance, paymentId);
    showToast("Advance payment updated");
    await reloadOrdersAndRender();
  } catch (err) { showToast(`Update failed: ${err.message}`, true); }
}

function renderOrdersPagination() {
  const container = document.getElementById("orders-pagination");
  if (!container) return;
  const totalPages = Math.ceil(filteredOrders.length / ordersPageSize) || 1;
  container.innerHTML = `
    <button id="orders-prev-btn" ${ordersCurrentPage === 1 ? "disabled" : ""}>◀ Prev</button>
    <span>Page ${ordersCurrentPage} of ${totalPages} (${filteredOrders.length} orders)</span>
    <button id="orders-next-btn" ${ordersCurrentPage === totalPages ? "disabled" : ""}>Next ▶</button>
    <span style="margin-left:8px">Jump: <input type="number" id="orders-goto-page" min="1" max="${totalPages}" style="width:65px"></span>
  `;
  document.getElementById("orders-prev-btn")?.addEventListener("click", () => {
    if (ordersCurrentPage > 1) { ordersCurrentPage--; renderOrdersTable(); }
  });
  document.getElementById("orders-next-btn")?.addEventListener("click", () => {
    if (ordersCurrentPage < totalPages) { ordersCurrentPage++; renderOrdersTable(); }
  });
  const goto = document.getElementById("orders-goto-page");
  if (goto) goto.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      let p = parseInt(goto.value);
      if (!isNaN(p) && p >= 1 && p <= totalPages) { ordersCurrentPage = p; renderOrdersTable(); }
    }
  });
}

function exportOrdersCSV() {
  const dataToExport = filteredOrders.map(o => ({
    "Order ID": o.order_id,
    "Order Date": o.order_date ? new Date(o.order_date).toLocaleDateString("en-IN") : "",
    "Customer Name": o.customer_name,
    "City": o.city,
    "Delivery Address": o.delivery_address,
    "Order Status": o.status,
    "Total Amount (₹)": o.total_amount,
    "Advance Payment (₹)": o.advance_paid,
    "Due (₹)": o.due,
    "Remark": o.remark
  }));
  downloadCSV(dataToExport, "shop2bhutan_orders.csv");
}

// ----- REVIEWS SECTION (minimal, known working) -----
let allReviews = [], reviewsFiltered = [], reviewsCurrentPage = 1, reviewsPageSize = 12;
async function fetchReviews() {
  const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
function filterReviews(reviews, search, filterStatus) {
  let filtered = [...reviews];
  if (search) {
    const lower = search.toLowerCase();
    filtered = filtered.filter(r => (r.full_name || "").toLowerCase().includes(lower));
  }
  if (filterStatus === "approved") filtered = filtered.filter(r => r.is_approved === true);
  else if (filterStatus === "pending") filtered = filtered.filter(r => !r.is_approved);
  return filtered;
}
async function reloadReviewsAndRender() {
  try {
    const searchVal = document.getElementById("review-search")?.value.trim() || "";
    const filterVal = document.getElementById("review-filter")?.value || "all";
    allReviews = await fetchReviews();
    reviewsFiltered = filterReviews(allReviews, searchVal, filterVal);
    reviewsCurrentPage = 1;
    renderReviewsGrid();
  } catch (e) {
    document.getElementById("reviews-container").innerHTML = `<p style="color:red">⚠️ ${e.message}</p>`;
  }
}
function renderReviewsGrid() {
  const container = document.getElementById("reviews-container");
  if (!container) return;
  const start = (reviewsCurrentPage - 1) * reviewsPageSize;
  const pageData = reviewsFiltered.slice(start, start + reviewsPageSize);
  if (pageData.length === 0) {
    container.innerHTML = "<p>✨ No reviews found.</p>";
    renderReviewsPagination();
    return;
  }
  container.innerHTML = "";
  for (const rev of pageData) {
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
      <h3>${escapeHtml(rev.full_name || "Anonymous")}</h3>
      <div class="review-meta">📅 ${rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ""} • ⭐ ${rev.rating || "?"}/5</div>
      <p>${escapeHtml(rev.message || rev.comment || "")}</p>
      <div class="review-actions">
        <button class="approve-btn ${rev.is_approved ? "approved" : "pending"}" data-review-id="${rev.id}" data-approved="${rev.is_approved}">${rev.is_approved ? "✅ Approved" : "⏳ Approve"}</button>
        <button class="delete-btn" data-review-id="${rev.id}">🗑️ Delete</button>
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
  const btn = e.target;
  const id = btn.dataset.reviewId;
  const currentApproved = btn.dataset.approved === "true";
  const { error } = await supabase.from("reviews").update({ is_approved: !currentApproved }).eq("id", id);
  if (error) showToast("Failed", true);
  else { showToast("Review status updated"); await reloadReviewsAndRender(); }
}
async function handleDelete(e) {
  if (!confirm("Delete permanently?")) return;
  const id = e.target.dataset.reviewId;
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) showToast("Delete failed", true);
  else { showToast("Review deleted"); await reloadReviewsAndRender(); }
}
function renderReviewsPagination() {
  const container = document.getElementById("reviews-pagination");
  if (!container) return;
  const totalPages = Math.ceil(reviewsFiltered.length / reviewsPageSize) || 1;
  container.innerHTML = `
    <button id="reviews-prev-btn" ${reviewsCurrentPage === 1 ? "disabled" : ""}>◀ Prev</button>
    <span>Page ${reviewsCurrentPage} of ${totalPages}</span>
    <button id="reviews-next-btn" ${reviewsCurrentPage === totalPages ? "disabled" : ""}>Next ▶</button>
  `;
  document.getElementById("reviews-prev-btn")?.addEventListener("click", () => {
    if (reviewsCurrentPage > 1) { reviewsCurrentPage--; renderReviewsGrid(); }
  });
  document.getElementById("reviews-next-btn")?.addEventListener("click", () => {
    if (reviewsCurrentPage < totalPages) { reviewsCurrentPage++; renderReviewsGrid(); }
  });
}
function exportReviewsCSV() {
  const data = allReviews.map(r => ({
    "Name": r.full_name,
    "Rating": r.rating,
    "Message": r.message || r.comment,
    "Approved": r.is_approved ? "Yes" : "No",
    "Created": r.created_at
  }));
  downloadCSV(data, "shop2bhutan_reviews.csv");
}
function downloadCSV(data, filename) {
  if (!data.length) { showToast("No data", true); return; }
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  for (const row of data) {
    const values = headers.map(h => `"${String(row[h] || "").replace(/"/g, '""')}"`);
    csvRows.push(values.join(","));
  }
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast(`Exported ${data.length} records`);
}

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(`${tab}-tab`).classList.add("active");
  document.getElementById("orders-section").style.display = tab === "orders" ? "block" : "none";
  document.getElementById("reviews-section").style.display = tab === "reviews" ? "block" : "none";
  if (tab === "orders") reloadOrdersAndRender();
  if (tab === "reviews") reloadReviewsAndRender();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("orders-tab").addEventListener("click", () => switchTab("orders"));
  document.getElementById("reviews-tab").addEventListener("click", () => switchTab("reviews"));
  document.getElementById("logout-btn").addEventListener("click", async () => {
    if (confirm("Logout?")) {
      await supabase.auth.signOut();
      localStorage.removeItem("sb_admin_session");
      window.location.href = "/admin-login.html";
    }
  });
  document.getElementById("order-search").addEventListener("input", () => applySearchAndRenderOrders());
  document.getElementById("orders-refresh-btn").addEventListener("click", () => reloadOrdersAndRender());
  document.getElementById("review-search").addEventListener("input", () => reloadReviewsAndRender());
  document.getElementById("review-filter").addEventListener("change", () => reloadReviewsAndRender());
  document.getElementById("reviews-refresh-btn").addEventListener("click", () => reloadReviewsAndRender());
  document.getElementById("orders-page-size").addEventListener("change", (e) => {
    ordersPageSize = parseInt(e.target.value);
    ordersCurrentPage = 1;
    renderOrdersTable();
  });
  document.getElementById("reviews-page-size").addEventListener("change", (e) => {
    reviewsPageSize = parseInt(e.target.value);
    reviewsCurrentPage = 1;
    renderReviewsGrid();
  });
  document.getElementById("export-orders-btn").addEventListener("click", () => exportOrdersCSV());
  document.getElementById("export-reviews-btn").addEventListener("click", () => exportReviewsCSV());
  reloadOrdersAndRender();
  reloadReviewsAndRender();
});