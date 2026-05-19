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
// TAB SWITCHING
// ======================================================

window.switchTab = function(tab) {

  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  document.getElementById(`${tab}-tab`)
    .classList.add("active");

  document.getElementById("orders-section").style.display =
    tab === "orders" ? "block" : "none";

  document.getElementById("reviews-section").style.display =
    tab === "reviews" ? "block" : "none";

  if (tab === "orders") {
    loadOrders();
  }

  if (tab === "reviews") {
    loadReviews();
  }
};

// ======================================================
// DYNAMIC SEARCH
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const searchInput =
      document.getElementById("order-search");

    if (searchInput) {

      searchInput.addEventListener(
        "input",
        function () {

          const value =
            this.value.trim();

          loadOrders(value);
        }
      );
    }

    loadOrders();
  }
);

// OPTIONAL MANUAL SEARCH
window.searchOrders = function () {

  const value =
    document.getElementById("order-search").value;

  loadOrders(value);
};

// ======================================================
// LOAD ORDERS
// ======================================================

async function loadOrders(filter = "") {

  const tbody =
    document.getElementById("orders-body");

  tbody.innerHTML = `
    <tr>
      <td colspan="8"
          style="text-align:center;padding:40px;">
        Loading...
      </td>
    </tr>
  `;

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  // SEARCH FILTER
  if (filter) {

  const search =
  filter.replace(/,/g, "");

query = query.or(
  `order_id.ilike.%${search}%,full_name.ilike.%${search}%,delivery_city.ilike.%${search}%`
);
  }

  const { data, error } = await query;

  if (error) {

    console.error(error);

    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="color:red;">
          ${error.message}
        </td>
      </tr>
    `;

    return;
  }

  if (!data || data.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8"
            style="text-align:center;padding:40px;">
          No orders found
        </td>
      </tr>
    `;

    return;
  }

  let html = "";

  data.forEach(order => {

    const orderId = order.id;

    html += `
      <tr>

        <!-- ORDER ID -->
        <td>
          <strong>${order.order_id}</strong>
        </td>

        <!-- CUSTOMER -->
        <td>
          ${order.full_name || ""}
        </td>

        <!-- CITY -->
        <td>
          ${order.delivery_city || "-"}
        </td>

        <!-- STATUS -->
        <td>

          <span
            class="status-badge"
            data-order-id="${orderId}"
          >
            ${order.status || "pending"}
          </span>

        </td>

        <!-- DATE -->
        <td>

          ${new Date(order.created_at)
            .toLocaleDateString("en-IN")}

        </td>

        <!-- ACTIONS -->
        <td>

          <select
            class="status-select"
            data-order-id="${orderId}"
          >

            ${statusOptions.map(status => `

              <option
                value="${status}"
                ${(order.status || "")
                  .toLowerCase() === status
                    ? "selected"
                    : ""}
              >
                ${status}
              </option>

            `).join("")}

          </select>

          <button
            class="remark-btn"
            data-order-id="${orderId}"
          >
            Remark
          </button>

        </td>

        <!-- FINAL TOTAL -->
        <td>

          <input
            type="number"
            class="final-total-input"
            data-order-id="${orderId}"
            value="${order.final_total || ""}"
            placeholder="Final Total"
          >

          <button
            class="save-final-btn"
            data-order-id="${orderId}"
          >
            Save
          </button>

        </td>

        <!-- DUE AMOUNT -->
        <td>

          <input
            type="number"
            class="due-amount-input"
            data-order-id="${orderId}"
            value="${order.due_amount || ""}"
            placeholder="Due Amount"
          >

          <button
            class="save-due-btn"
            data-order-id="${orderId}"
          >
            Save
          </button>

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

let listenersAttached = false;

function attachTableListeners() {

  if (listenersAttached) return;

  listenersAttached = true;

  const tbody =
    document.getElementById("orders-body");

  // STATUS CHANGE
  tbody.addEventListener("change", async (e) => {

    if (
      e.target.classList.contains("status-select")
    ) {

      const orderId =
        e.target.getAttribute("data-order-id");

      const newStatus =
        e.target.value;

      await updateOrderStatus(
        orderId,
        newStatus
      );
    }
  });

  // BUTTON CLICKS
  tbody.addEventListener("click", async (e) => {

    // REMARK
    if (
      e.target.classList.contains("remark-btn")
    ) {

      const orderId =
        e.target.getAttribute("data-order-id");

      await addRemark(orderId);
    }

    // FINAL TOTAL
    if (
      e.target.classList.contains("save-final-btn")
    ) {

      const orderId =
        e.target.getAttribute("data-order-id");

      const input = document.querySelector(
        `.final-total-input[data-order-id="${orderId}"]`
      );

      await updateFinalTotal(
        orderId,
        input.value
      );
    }

    // DUE AMOUNT
    if (
      e.target.classList.contains("save-due-btn")
    ) {

      const orderId =
        e.target.getAttribute("data-order-id");

      const input = document.querySelector(
        `.due-amount-input[data-order-id="${orderId}"]`
      );

      await updateDueAmount(
        orderId,
        input.value
      );
    }
  });
}

// ======================================================
// UPDATE STATUS
// ======================================================

async function updateOrderStatus(id, status) {

  const { error } = await supabase
    .from("orders")
    .update({
      status: status,
      last_updated: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    alert("Failed to update status");

    return;
  }

  // UPDATE BADGE INSTANTLY
  const badge = document.querySelector(
    `.status-badge[data-order-id="${id}"]`
  );

  if (badge) {
    badge.textContent = status;
  }

  alert("✅ Status updated");
}

// ======================================================
// ADD REMARK
// ======================================================

async function addRemark(id) {

  const remark = prompt(
    "Enter latest remark/update:"
  );

  if (!remark || !remark.trim()) {
    return;
  }

  const { error } = await supabase
    .from("orders")
    .update({
      remark: remark,
      last_updated: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    alert("Failed to save remark");

  } else {

    alert("✅ Remark saved");
  }
}

// ======================================================
// UPDATE FINAL TOTAL
// ======================================================

async function updateFinalTotal(id, amount) {

  const { error } = await supabase
    .from("orders")
    .update({
      final_total: amount,
      last_updated: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    alert("Failed to update final total");

  } else {

    alert("✅ Final total updated");
  }
}

// ======================================================
// UPDATE DUE AMOUNT
// ======================================================

async function updateDueAmount(id, amount) {

  const { error } = await supabase
    .from("orders")
    .update({
      due_amount: amount,
      last_updated: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    alert("Failed to update due amount");

  } else {

    alert("✅ Due amount updated");
  }
}

// ======================================================
// LOAD REVIEWS
// ======================================================

async function loadReviews() {

  const container =
    document.getElementById("reviews-container");

  container.innerHTML = `
    <p>Loading reviews...</p>
  `;

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    container.innerHTML = `
      <p style="color:red;">
        ${error.message}
      </p>
    `;

    return;
  }

  if (!data || data.length === 0) {

    container.innerHTML =
      "<p>No reviews yet.</p>";

    return;
  }

  container.innerHTML = data.map(review => `

    <div class="review-card">

      <h3>
        ${review.full_name || "Anonymous"}
      </h3>

      <p>
        ${review.message || review.comment || ""}
      </p>

      <div style="margin-top:10px;">

        <button
          onclick="toggleApprove(
            '${review.id}',
            ${review.is_approved}
          )"
        >
          ${review.is_approved
            ? "✅ Approved"
            : "Approve"}
        </button>

        <button
          onclick="deleteReview('${review.id}')"
          class="delete-btn"
        >
          Delete
        </button>

      </div>

    </div>

  `).join("");
}

// ======================================================
// TOGGLE APPROVE
// ======================================================

window.toggleApprove = async (
  id,
  current
) => {

  const { error } = await supabase
    .from("reviews")
    .update({
      is_approved: !current
    })
    .eq("id", id);

  if (error) {

    alert("Failed to update");

  } else {

    loadReviews();
  }
};

// ======================================================
// DELETE REVIEW
// ======================================================

window.deleteReview = async (id) => {

  if (!confirm("Delete this review?")) {
    return;
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id);

  if (error) {

    alert("Failed to delete");

  } else {

    loadReviews();
  }
};

// ======================================================
// LOGOUT
// ======================================================

window.logout = function() {

  if (
    confirm("Are you sure you want to logout?")
  ) {

    localStorage.removeItem("sb_admin");

    window.location.href =
      "/admin-login.html";
  }
};