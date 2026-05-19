import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://deecrnfbvgbzyybqhywy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8"
);

// ========== CONFIGURATION ==========
const trackingSteps = [
  { key: "pending",       label: "Pending" },
  { key: "ordered",       label: "Order Confirmed" },
  { key: "purchased",     label: "Purchased" },
  { key: "shipped",       label: "Shipped from India" },
  { key: "jaigaon",       label: "Arrived at Jaigaon" },
  { key: "phuentsholing", label: "Arrived at Phuentsholing" },
  { key: "delivery",      label: "Out for Delivery" },
  { key: "delivered",     label: "Delivered" }
];

const estimatedMap = {
  "pending":      "-",
  "ordered":      "5-7 days",
  "purchased":    "4-6 days",
  "shipped":      "2-4 days",
  "jaigaon":      "1-2 days",
  "phuentsholing":"1 day",
  "delivery":     "Today",
  "delivered":    "Completed"
};

// ========== HELPERS ==========
function getPaymentStatus(order) {
  const total = Number(order.final_total || 0);
  const paid = Number(order.advance_paid || 0);
  if (!total) return "Advance Pending";
  if (paid <= 0) return "Advance Pending";
  if (paid >= total) return "Paid";
  return "Partially Paid";
}

function formatBTTime(date) {
  return new Date(date).toLocaleString("en-BT", {
    timeZone: "Asia/Thimphu",
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getEstimated(data) {
  if (data.estimated_delivery) return data.estimated_delivery;
  const key = (data.status || '').toLowerCase();
  return estimatedMap[key] || "Processing";
}

// ========== RENDER MODERN UI ==========
function renderOrderTracking(order) {
  const statusKey = (order.status || '').toLowerCase().trim();
  const currentIndex = trackingSteps.findIndex(step => step.key === statusKey);
  const progressPercent = currentIndex >= 0 ? Math.min(((currentIndex + 1) / trackingSteps.length) * 100, 100) : 10;

  const stepsHTML = trackingSteps.map((step, idx) => {
    const completed = idx < currentIndex;
    const active = idx === currentIndex;
    let icon = '';
    if (completed) icon = '✓';
    else if (active) icon = '🚚';
    else icon = idx + 1;
    return `
      <div class="step-item ${completed ? 'completed' : ''} ${active ? 'active' : ''}">
        <div class="step-circle">${icon}</div>
        <div class="step-label">${step.label}</div>
      </div>
    `;
  }).join('');

  const resultDiv = document.getElementById('result');
  resultDiv.classList.remove('hidden');

  resultDiv.innerHTML = `
    <div class="order-card">
      <div class="order-header">
        <div class="order-title">
          <i class="fas fa-box"></i>
          <h3>${order.order_id}</h3>
        </div>
        <span class="status-badge ${order.status || 'pending'}">${order.status || 'Pending'}</span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <i class="fas fa-calendar"></i>
          <span class="info-label">Order Date</span>
          <strong>${formatBTTime(order.created_at)}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-map-marker-alt"></i>
          <span class="info-label">City</span>
          <strong>${order.delivery_city || '—'}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-user"></i>
          <span class="info-label">Customer</span>
          <strong>${escapeHtml(order.full_name) || '—'}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-credit-card"></i>
          <span class="info-label">Payment Status</span>
          <strong class="payment-status">${getPaymentStatus(order)}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-money-bill"></i>
          <span class="info-label">Due Amount</span>
          <strong class="due-amount">Nu. ${Number(order.due_amount || 0).toLocaleString()}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-truck"></i>
          <span class="info-label">Est. Delivery</span>
          <strong>${getEstimated(order)}</strong>
        </div>
      </div>

      ${order.product_links ? `
        <div class="product-section">
          <i class="fas fa-link"></i>
          <a href="${escapeHtml(order.product_links)}" target="_blank">${escapeHtml(order.product_links)}</a>
        </div>
      ` : ''}

      ${order.screenshot_url ? `
        <div class="screenshot-section">
          <i class="fas fa-image"></i>
          <strong>Payment Proof</strong>
          <img src="${escapeHtml(order.screenshot_url)}" alt="Payment Screenshot">
        </div>
      ` : ''}

      <div class="timeline-section">
        <h4><i class="fas fa-chart-line"></i> Tracking Progress</h4>
        <div class="tracking-timeline" style="--progress: ${progressPercent}%;">
          ${stepsHTML}
        </div>
      </div>

      ${order.remark ? `
        <div class="remark-section">
          <i class="fas fa-comment-dots"></i>
          <strong>Latest Update:</strong>
          <p>${escapeHtml(order.remark)}</p>
        </div>
      ` : ''}

      <button class="refresh-btn" id="refreshOrderBtn">
        <i class="fas fa-sync-alt"></i> Refresh Status
      </button>
    </div>
  `;

  // Attach refresh event
  const refreshBtn = document.getElementById('refreshOrderBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const orderIdInput = document.getElementById('orderId').value.trim().toUpperCase();
      if (orderIdInput === order.order_id) {
        searchOrder();
      } else {
        document.getElementById('orderId').value = order.order_id;
        searchOrder();
      }
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ========== MAIN SEARCH ==========
window.searchOrder = async function searchOrder() {
  const orderIdEl = document.getElementById('orderId');
  const resultDiv = document.getElementById('result');
  const searchBtn = document.getElementById('searchBtn');

  let orderIdInput = orderIdEl.value.trim().toUpperCase();
  if (!orderIdInput) {
    alert("Please enter your Order ID");
    return;
  }

  resultDiv.classList.remove('hidden');
  resultDiv.innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Searching for <strong>${orderIdInput}</strong>...</div>`;
  searchBtn.disabled = true;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderIdInput)
      .single();

    if (error || !data) {
      resultDiv.innerHTML = `<div class="error-state"><i class="fas fa-search"></i> Order ID <strong>${orderIdInput}</strong> not found.</div>`;
      return;
    }

    renderOrderTracking(data);
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i> Something went wrong. Please try again.</div>`;
  } finally {
    searchBtn.disabled = false;
  }
};

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const orderInput = document.getElementById('orderId');

  if (searchBtn) searchBtn.addEventListener('click', window.searchOrder);
  if (orderInput) {
    orderInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.searchOrder();
    });
  }
});