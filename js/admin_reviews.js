// ======================================================
// Shop2Bhutan Admin Panel
// ======================================================

import { createClient }
from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ======================================================
// SUPABASE
// ======================================================

const supabase = createClient(
  "https://deecrnfbvgbzyybqhywy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8"
);

// ======================================================
// STATUS OPTIONS
// ======================================================

const statusOptions = [
  "pending",
  "ordered",
  "purchased",
  "shipped",
  "jaigaon",
  "phuentsholing",
  "delivery",
  "delivered"
];

// ======================================================
// AUTH CHECK
// ======================================================

if (!localStorage.getItem("sb_admin")) {
  window.location.href = "/admin-login.html";
}

// ======================================================
// PAYMENT STATUS
// ======================================================

function getPaymentStatus(order) {
  const total = Number(order.final_total  || 0);
  const paid  = Number(order.advance_paid || 0);

  if (!total && paid <= 0) return "Advance Pending";
  if (total > 0 && paid <= 0) return "Advance Pending";
  if (total > 0 && paid >= total) return "Paid";
  if (total > 0 && paid > 0 && paid < total) return "Partially Paid";
  return "Advance Received";
}

// ======================================================
// LOAD ORDERS
// ======================================================

async function loadOrders(filter = "") {

  const tbody = document.getElementById("orders-body");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="9" style="text-align:center;padding:40px;color:#64748b;">
        Loading...
      </td>
    </tr>
  `;

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter) {
    const search = filter
      .replace(/,/g, "")
      .replace(/[%_'"\\]/g, "");

    if (search) {
      query = query.or(
        `order_id.ilike.%${search}%,` +
        `full_name.ilike.%${search}%,` +
        `delivery_city.ilike.%${search}%`
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Orders fetch error:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="color:red;text-align:center;padding:30px;">
          ⚠️ ${error.message}
        </td>
      </tr>
    `;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;padding:40px;color:#64748b;">
          No orders found
        </td>
      </tr>
    `;
    return;
  }

  let html = "";

  data.forEach(order => {
    const orderId     = order.id;
    const finalTotal  = Number(order.final_total  || 0);
    const advancePaid = Number(order.advance_paid || 0);
    const dueAmount   = Math.max(0, finalTotal - advancePaid);
    const payStatus   = getPaymentStatus(order);
    const curStatus   = (order.status || "pending").toLowerCase();

    html += `
      <tr>
        <td><strong>${order.order_id || ""}</strong></td>
        <td>${order.full_name || ""}</td>
        <td>${order.delivery_city || "-"}</td>
        <td>
          <span class="status-badge" data-order-id="${orderId}" data-status="${curStatus}">
            ${curStatus}
          </span>
          <div class="payment-status">${payStatus}</div>
        </td>
        <td>${new Date(order.created_at).toLocaleDateString("en-IN")}</td>
        <td>
          <select class="status-select" data-order-id="${orderId}">
            ${statusOptions.map(s => `
              <option value="${s}" ${curStatus === s ? "selected" : ""}>${s}</option>
            `).join("")}
          </select>
          <button class="remark-btn" data-order-id="${orderId}">💬 Remark</button>
        </td>
        <td>
          <input type="number" class="table-input final-total-input"
            data-order-id="${orderId}"
            value="${order.final_total || ""}"
            placeholder="Enter total">
          <button class="save-btn save-final-btn" data-order-id="${orderId}">Save</button>
        </td>
        <td>
          <input type="number" class="table-input" value="${dueAmount}" readonly>
        </td>
        <td>
          <input type="number" class="table-input advance-paid-input"
            data-order-id="${orderId}"
            value="${order.advance_paid || ""}"
            placeholder="Advance paid">
          <button class="save-btn save-advance-btn" data-order-id="${orderId}">Save</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  attachTableListeners();
}

// ======================================================
// TABLE LISTENERS
// ======================================================

function attachTableListeners() {
  const tbody = document.getElementById("orders-body");
  if (!tbody) return;

  const fresh = tbody.cloneNode(true);
  tbody.parentNode.replaceChild(fresh, tbody);

  fresh.addEventListener("change", async (e) => {
    if (e.target.classList.contains("status-select")) {
      await updateOrderStatus(
        e.target.getAttribute("data-order-id"),
        e.target.value
      );
    }
  });

  fresh.addEventListener("click", async (e) => {

    if (e.target.classList.contains("remark-btn")) {
      await addRemark(e.target.getAttribute("data-order-id"));
    }

    if (e.target.classList.contains("save-final-btn")) {
      const id    = e.target.getAttribute("data-order-id");
      const input = fresh.querySelector(`.final-total-input[data-order-id="${id}"]`);
      setButtonLoading(e.target, true);
      await updateFinalTotal(id, input.value);
      setButtonLoading(e.target, false);
    }

    if (e.target.classList.contains("save-advance-btn")) {
      const id    = e.target.getAttribute("data-order-id");
      const input = fresh.querySelector(`.advance-paid-input[data-order-id="${id}"]`);
      setButtonLoading(e.target, true);
      await updateAdvancePaid(id, input.value);
      setButtonLoading(e.target, false);
    }
  });
}

function setButtonLoading(btn, isLoading) {
  btn.disabled    = isLoading;
  btn.textContent = isLoading ? "Saving..." : "Save";
}

// ======================================================
// UPDATE STATUS
// ======================================================

async function updateOrderStatus(id, status) {
  const { error } = await supabase
    .from("orders")
    .update({ status, last_updated: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Failed to update status");
    return;
  }

  const badge = document.querySelector(`.status-badge[data-order-id="${id}"]`);
  if (badge) {
    badge.textContent = status;
    badge.setAttribute("data-status", status);
  }

  alert("Status updated");
}

// ======================================================
// ADD REMARK
// ======================================================

async function addRemark(id) {
  const remark = prompt("Enter latest remark/update:");
  if (!remark || !remark.trim()) return;

  const { error } = await supabase
    .from("orders")
    .update({ remark: remark.trim(), last_updated: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Failed to save remark");
  } else {
    alert("Remark saved");
  }
}

// ======================================================
// UPDATE FINAL TOTAL
// ======================================================

async function updateFinalTotal(id, amount) {
  const finalTotal = Number(amount || 0);

  const { data: cur, error: fetchErr } = await supabase
    .from("orders")
    .select("advance_paid")
    .eq("id", id)
    .single();

  if (fetchErr) {
    console.error(fetchErr);
    alert("Failed to fetch order data");
    return;
  }

  const advancePaid = Number(cur?.advance_paid || 0);
  const dueAmount   = Math.max(0, finalTotal - advancePaid);

  const { error } = await supabase
    .from("orders")
    .update({ final_total: finalTotal, due_amount: dueAmount, last_updated: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Failed to update final total");
  } else {
    alert("Final total updated");
    await loadOrders(document.getElementById("order-search")?.value?.trim() || "");
  }
}

// ======================================================
// UPDATE ADVANCE PAID
// ======================================================

async function updateAdvancePaid(id, amount) {
  const { data: ord, error: fetchErr } = await supabase
    .from("orders")
    .select("final_total")
    .eq("id", id)
    .single();

  if (fetchErr) {
    console.error(fetchErr);
    alert("Failed to fetch order");
    return;
  }

  const finalTotal  = Number(ord.final_total || 0);
  const advancePaid = Number(amount || 0);
  const dueAmount   = Math.max(0, finalTotal - advancePaid);

  const { error } = await supabase
    .from("orders")
    .update({ advance_paid: advancePaid, due_amount: dueAmount, last_updated: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Failed to update advance");
  } else {
    alert("Advance payment updated");
    await loadOrders(document.getElementById("order-search")?.value?.trim() || "");
  }
}

// ======================================================
// LOAD REVIEWS
// ======================================================

async function loadReviews() {
  const container = document.getElementById("reviews-container");
  if (!container) return;

  container.innerHTML = `<p style="color:#64748b;padding:20px;">Loading reviews...</p>`;

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Reviews fetch error:", error);
    container.innerHTML = `<p style="color:red;padding:20px;">⚠️ ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<p style="color:#64748b;padding:20px;">No reviews yet.</p>`;
    return;
  }

  const searchVal = (document.getElementById("review-search")?.value || "").toLowerCase().trim();
  const filterVal = document.getElementById("review-filter")?.value || "all";

  const filtered = data.filter(r => {
    const name        = (r.full_name || "").toLowerCase();
    const matchSearch = !searchVal || name.includes(searchVal);
    const matchFilter =
      filterVal === "all" ||
      (filterVal === "approved" && r.is_approved) ||
      (filterVal === "pending"  && !r.is_approved);
    return matchSearch && matchFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="color:#64748b;padding:20px;">No reviews match your filter.</p>`;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const approved = Boolean(r.is_approved);
    const date     = r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "";

    return `
      <div class="review-card">
        <h3>${r.full_name || "Anonymous"}</h3>
        <div class="review-meta">📅 ${date}</div>
        <p>${r.message || r.comment || ""}</p>
        <div class="review-actions">
          <button
            class="approve-btn ${approved ? "approved" : "pending"}"
            data-review-id="${r.id}"
            data-approved="${approved}"
          >${approved ? "✅ Approved" : "⏳ Approve"}</button>
          <button class="delete-btn" data-review-id="${r.id}">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join("");

  attachReviewListeners();
}

// ======================================================
// REVIEW LISTENERS
// ======================================================

function attachReviewListeners() {
  const container = document.getElementById("reviews-container");
  if (!container) return;

  const fresh = container.cloneNode(true);
  container.parentNode.replaceChild(fresh, container);

  fresh.addEventListener("click", async (e) => {
    if (e.target.classList.contains("approve-btn")) {
      const id      = e.target.getAttribute("data-review-id");
      const current = e.target.getAttribute("data-approved") === "true";
      await toggleApprove(id, current);
    }

    if (e.target.classList.contains("delete-btn")) {
      await deleteReview(e.target.getAttribute("data-review-id"));
    }
  });
}

async function toggleApprove(id, current) {
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: !current })
    .eq("id", id);

  if (error) {
    alert("Failed to update review");
  } else {
    await loadReviews();
  }
}

async function deleteReview(id) {
  if (!confirm("Delete this review? This cannot be undone.")) return;

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Failed to delete review");
  } else {
    await loadReviews();
  }
}

// ======================================================
// TAB SWITCHING
// Defined AFTER loadOrders / loadReviews so they are in scope
// ======================================================

window.switchTab = function (tab) {
  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  document.getElementById(`${tab}-tab`).classList.add("active");

  document.getElementById("orders-section").style.display =
    tab === "orders" ? "block" : "none";

  document.getElementById("reviews-section").style.display =
    tab === "reviews" ? "block" : "none";

  if (tab === "orders")  loadOrders();
  if (tab === "reviews") loadReviews();
};

// ======================================================
// LOGOUT
// ======================================================

window.logout = function () {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("sb_admin");
    window.location.href = "/admin-login.html";
  }
};

// ======================================================
// SEARCH LISTENERS
// Placed at the bottom — all functions defined above
// ======================================================

document.getElementById("order-search")
  ?.addEventListener("input", function () {
    loadOrders(this.value.trim());
  });

document.getElementById("review-search")
  ?.addEventListener("input", () => loadReviews());

document.getElementById("review-filter")
  ?.addEventListener("change", () => loadReviews());

// Expose for HTML onclick attributes
window.loadOrders  = loadOrders;
window.loadReviews = loadReviews;

// Initial load
loadOrders();