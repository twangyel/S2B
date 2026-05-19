import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://deecrnfbvgbzyybqhywy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8";

const sessionToken = localStorage.getItem("sb_admin_session");
if (!sessionToken) window.location.href = "/admin-login.html";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${sessionToken}` } }
});

supabase.auth.getUser().then(({ error }) => {
  if (error) { localStorage.removeItem("sb_admin_session"); window.location.href = "/admin-login.html"; }
});

// ---------- helpers ----------
function showToast(msg, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${isError ? "error" : "success"}`;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}

function escapeHtml(str) { if (!str) return ""; return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }

const statusOptions = ["pending", "ordered", "purchased", "shipped", "jaigaon", "phuentsholing", "delivery", "delivered"];

// ---------- orders state ----------
let allOrders = [];           // master list from DB
let ordersFiltered = [];      // after search
let ordersCurrentPage = 1;
let ordersPageSize = 25;
let currentSearchTerm = "";   // store search term

function getPaymentStatus(order) {
  const total = Number(order.final_total || 0);
  const paid = Number(order.advance_paid || 0);
  if (total > 0 && paid <= 0) return "Advance Pending";
  if (total > 0 && paid >= total) return "Paid";
  if (total > 0 && paid > 0 && paid < total) return "Partially Paid";
  if (paid > 0 && total === 0) return "Advance Received";
  return "Pending";
}

// Fetch all orders once (no search filter in DB)
async function fetchAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Client-side filter by order_id, full_name, delivery_city
function filterOrdersClientSide(orders, term) {
  if (!term.trim()) return [...orders];
  const lowerTerm = term.toLowerCase().trim();
  return orders.filter(order => {
    const id = (order.order_id || "").toLowerCase();
    const name = (order.full_name || "").toLowerCase();
    const city = (order.delivery_city || "").toLowerCase();
    return id.includes(lowerTerm) || name.includes(lowerTerm) || city.includes(lowerTerm);
  });
}

// Reload master data from DB, then apply current search filter
async function reloadOrdersAndRender() {
  try {
    allOrders = await fetchAllOrders();
    applySearchAndRender();
  } catch (e) {
    document.getElementById("orders-body").innerHTML = `<tr><td colspan="10">⚠️ ${e.message}</td></tr>`;
  }
}

// Apply current search term to allOrders, update pagination, re-render
function applySearchAndRender() {
  const searchInput = document.getElementById("order-search");
  currentSearchTerm = searchInput ? searchInput.value : "";
  ordersFiltered = filterOrdersClientSide(allOrders, currentSearchTerm);
  ordersCurrentPage = 1;  // reset to first page on new search
  renderOrdersTable();
}

// Render current page of filtered orders
function renderOrdersTable() {
  const tbody = document.getElementById("orders-body");
  if (!tbody) return;
  const start = (ordersCurrentPage - 1) * ordersPageSize;
  const pageData = ordersFiltered.slice(start, start + ordersPageSize);
  if (pageData.length === 0 && ordersFiltered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10">📭 No orders found</td></tr>`;
    renderOrdersPagination();
    return;
  }
  if (pageData.length === 0 && ordersFiltered.length > 0) {
    ordersCurrentPage = Math.max(1, Math.ceil(ordersFiltered.length / ordersPageSize));
    renderOrdersTable();
    return;
  }
  tbody.innerHTML = "";
  for (const order of pageData) {
    const statusClass = `status-${(order.status || "pending").toLowerCase()}`;
    const payStatus = getPaymentStatus(order);
    const dueAmount = Math.max(0, (order.final_total || 0) - (order.advance_paid || 0));
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(order.order_id || "#")}</strong></td>
      <td>${escapeHtml(order.full_name || "-")}</td>
      <td>${escapeHtml(order.delivery_city || "-")}</td>
      <td><span class="status-badge ${statusClass}" data-order-id="${order.id}">${order.status || "pending"}</span><div class="payment-status">${payStatus}</div></td>
      <td>${order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "-"}</td>
      <td><input type="number" class="table-input final-total-input" data-order-id="${order.id}" value="${order.final_total ?? ""}" placeholder="total" step="any"><button class="save-btn save-final-btn" data-order-id="${order.id}">💾</button></td>
      <td><input type="number" class="table-input advance-paid-input" data-order-id="${order.id}" value="${order.advance_paid ?? ""}" placeholder="advance" step="any"><button class="save-btn save-advance-btn" data-order-id="${order.id}">💾</button></td>
      <td class="due-amount-cell">${dueAmount.toFixed(2)}</td>
      <td class="remark-cell">${escapeHtml(order.remark || "-")}</td>
      <td>
        <select class="status-select" data-order-id="${order.id}">${statusOptions.map(s => `<option value="${s}" ${(order.status || "pending") === s ? "selected" : ""}>${s}</option>`).join("")}</select>
        <button class="remark-btn" data-order-id="${order.id}">💬 Remark</button>
      </td>
    `;
    tbody.appendChild(row);
  }
  attachOrdersRowEvents();
  renderOrdersPagination();
}

function attachOrdersRowEvents() {
  document.querySelectorAll(".status-select").forEach(sel => {
    sel.removeEventListener("change", handleStatusChange);
    sel.addEventListener("change", handleStatusChange);
  });
  document.querySelectorAll(".remark-btn").forEach(btn => {
    btn.removeEventListener("click", handleRemarkClick);
    btn.addEventListener("click", handleRemarkClick);
  });
  document.querySelectorAll(".save-final-btn").forEach(btn => {
    btn.removeEventListener("click", handleSaveFinal);
    btn.addEventListener("click", handleSaveFinal);
  });
  document.querySelectorAll(".save-advance-btn").forEach(btn => {
    btn.removeEventListener("click", handleSaveAdvance);
    btn.addEventListener("click", handleSaveAdvance);
  });
}

async function updateOrderField(orderId, field, value) {
  const updatePayload = { last_updated: new Date().toISOString() };
  if (field === "final_total" || field === "advance_paid") {
    let num = Number(value);
    if (isNaN(num) || num < 0) { showToast(`${field} must be non-negative`, true); return false; }
    updatePayload[field] = num;
    const { data: cur } = await supabase.from("orders").select("final_total, advance_paid").eq("id", orderId).single();
    if (cur) {
      const final = field === "final_total" ? num : (cur.final_total || 0);
      const advance = field === "advance_paid" ? num : (cur.advance_paid || 0);
      updatePayload.due_amount = Math.max(0, final - advance);
    }
  } else if (field === "status") updatePayload.status = value;
  else if (field === "remark") updatePayload.remark = value;
  else return false;
  const { error } = await supabase.from("orders").update(updatePayload).eq("id", orderId);
  if (error) { showToast(`Update failed: ${error.message}`, true); return false; }
  return true;
}

async function handleStatusChange(e) {
  const select = e.target;
  const orderId = select.dataset.orderId;
  const newStatus = select.value;
  const ok = await updateOrderField(orderId, "status", newStatus);
  if (ok) { showToast("Status updated"); await reloadOrdersAndRender(); }
  else await reloadOrdersAndRender();
}
async function handleRemarkClick(e) {
  const btn = e.target;
  const orderId = btn.dataset.orderId;
  const row = btn.closest("tr");
  const currentRemark = row?.querySelector(".remark-cell")?.innerText || "";
  const newRemark = prompt("Edit remark:", currentRemark);
  if (newRemark !== null && newRemark.trim() !== "") {
    const ok = await updateOrderField(orderId, "remark", newRemark.trim());
    if (ok) { showToast("Remark saved"); await reloadOrdersAndRender(); }
  }
}
async function handleSaveFinal(e) {
  const btn = e.target;
  const orderId = btn.dataset.orderId;
  const row = btn.closest("tr");
  const input = row.querySelector(".final-total-input");
  const val = input.value;
  const ok = await updateOrderField(orderId, "final_total", val);
  if (ok) { showToast("Final total updated"); await reloadOrdersAndRender(); }
  else await reloadOrdersAndRender();
}
async function handleSaveAdvance(e) {
  const btn = e.target;
  const orderId = btn.dataset.orderId;
  const row = btn.closest("tr");
  const input = row.querySelector(".advance-paid-input");
  const val = input.value;
  const ok = await updateOrderField(orderId, "advance_paid", val);
  if (ok) { showToast("Advance updated"); await reloadOrdersAndRender(); }
  else await reloadOrdersAndRender();
}

function renderOrdersPagination() {
  const container = document.getElementById("orders-pagination");
  if (!container) return;
  const totalPages = Math.ceil(ordersFiltered.length / ordersPageSize);
  container.innerHTML = `
    <button id="orders-prev-btn" ${ordersCurrentPage === 1 ? "disabled" : ""}>◀ Prev</button>
    <span class="page-info">Page ${ordersCurrentPage} of ${totalPages || 1} (${ordersFiltered.length} orders)</span>
    <button id="orders-next-btn" ${ordersCurrentPage === totalPages || totalPages === 0 ? "disabled" : ""}>Next ▶</button>
    <span style="margin-left:8px">Jump to: <input type="number" id="orders-goto-page" min="1" max="${totalPages}" style="width:65px"></span>
  `;
  document.getElementById("orders-prev-btn")?.addEventListener("click", () => { if (ordersCurrentPage > 1) { ordersCurrentPage--; renderOrdersTable(); } });
  document.getElementById("orders-next-btn")?.addEventListener("click", () => { if (ordersCurrentPage < totalPages) { ordersCurrentPage++; renderOrdersTable(); } });
  const goto = document.getElementById("orders-goto-page");
  if (goto) goto.addEventListener("keypress", (e) => { if (e.key === "Enter") { let p = parseInt(goto.value); if (!isNaN(p) && p >=1 && p <= totalPages) { ordersCurrentPage = p; renderOrdersTable(); } } });
}

// ---------- REVIEWS (same as before, no changes needed) ----------
let allReviews = [];
let reviewsFiltered = [];
let reviewsCurrentPage = 1;
let reviewsPageSize = 12;

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
  const searchVal = document.getElementById("review-search")?.value.trim() || "";
  const filterVal = document.getElementById("review-filter")?.value || "all";
  try {
    allReviews = await fetchReviews();
    reviewsFiltered = filterReviews(allReviews, searchVal, filterVal);
    reviewsCurrentPage = 1;
    renderReviewsGrid();
  } catch(e) { document.getElementById("reviews-container").innerHTML = `<p style="color:red">⚠️ ${e.message}</p>`; }
}

function renderReviewsGrid() {
  const container = document.getElementById("reviews-container");
  if (!container) return;
  const start = (reviewsCurrentPage - 1) * reviewsPageSize;
  const pageData = reviewsFiltered.slice(start, start + reviewsPageSize);
  if (pageData.length === 0 && reviewsFiltered.length === 0) { container.innerHTML = "<p>✨ No reviews found.</p>"; renderReviewsPagination(); return; }
  if (pageData.length === 0) { reviewsCurrentPage = Math.max(1, Math.ceil(reviewsFiltered.length / reviewsPageSize)); renderReviewsGrid(); return; }
  container.innerHTML = "";
  for (const rev of pageData) {
    const ratingStar = rev.rating ? `⭐ ${rev.rating}/5` : "⭐ no rating";
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
      <h3>${escapeHtml(rev.full_name || "Anonymous")}</h3>
      <div class="review-meta">📅 ${rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ""} • ${ratingStar}</div>
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
  if (error) showToast("Failed to update", true);
  else { showToast("Review status updated"); await reloadReviewsAndRender(); }
}
async function handleDelete(e) {
  if (!confirm("Delete this review permanently?")) return;
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
    <span class="page-info">Page ${reviewsCurrentPage} of ${totalPages} (${reviewsFiltered.length} reviews)</span>
    <button id="reviews-next-btn" ${reviewsCurrentPage === totalPages ? "disabled" : ""}>Next ▶</button>
  `;
  document.getElementById("reviews-prev-btn")?.addEventListener("click", () => { if (reviewsCurrentPage > 1) { reviewsCurrentPage--; renderReviewsGrid(); } });
  document.getElementById("reviews-next-btn")?.addEventListener("click", () => { if (reviewsCurrentPage < totalPages) { reviewsCurrentPage++; renderReviewsGrid(); } });
}

// ---------- EXPORT (updated to match current columns) ----------
function exportOrdersToCSV() {
  const dataToExport = ordersFiltered.map(o => ({
    "Order ID": o.order_id,
    "Customer": o.full_name,
    "City": o.delivery_city,
    "Status": o.status,
    "Final Total": o.final_total,
    "Advance Paid": o.advance_paid,
    "Due Amount": (o.final_total||0)-(o.advance_paid||0),
    "Remark": o.remark,
    "Date": o.created_at
  }));
  downloadCSV(dataToExport, "shop2bhutan_orders.csv");
}
function exportReviewsToCSV() {
  const dataToExport = allReviews.map(r => ({ "Name": r.full_name, "Rating": r.rating, "Message": r.message || r.comment, "Approved": r.is_approved ? "Yes" : "No", "Created": r.created_at }));
  downloadCSV(dataToExport, "shop2bhutan_reviews.csv");
}
function downloadCSV(data, filename) {
  if (!data.length) { showToast("No data to export", true); return; }
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

// ---------- TAB SWITCHING & EVENT BINDINGS ----------
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
  document.getElementById("logout-btn").addEventListener("click", async () => { if(confirm("Logout?")){ await supabase.auth.signOut(); localStorage.removeItem("sb_admin_session"); window.location.href="/admin-login.html"; } });
  
  // Search: trigger on every input (dynamic)
  const orderSearch = document.getElementById("order-search");
  if (orderSearch) {
    orderSearch.addEventListener("input", () => applySearchAndRender());
  }
  document.getElementById("orders-refresh-btn").addEventListener("click", () => reloadOrdersAndRender());
  
  document.getElementById("review-search").addEventListener("input", () => reloadReviewsAndRender());
  document.getElementById("review-filter").addEventListener("change", () => reloadReviewsAndRender());
  document.getElementById("reviews-refresh-btn").addEventListener("click", () => reloadReviewsAndRender());
  
  document.getElementById("orders-page-size").addEventListener("change", (e) => { ordersPageSize = parseInt(e.target.value); ordersCurrentPage = 1; renderOrdersTable(); });
  document.getElementById("reviews-page-size").addEventListener("change", (e) => { reviewsPageSize = parseInt(e.target.value); reviewsCurrentPage = 1; renderReviewsGrid(); });
  document.getElementById("export-orders-btn").addEventListener("click", () => exportOrdersToCSV());
  document.getElementById("export-reviews-btn").addEventListener("click", () => exportReviewsToCSV());
  
  reloadOrdersAndRender();
  reloadReviewsAndRender();
});