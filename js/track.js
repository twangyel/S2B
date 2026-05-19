import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://deecrnfbvgbzyybqhywy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8"
);



// ==================== TRACKING CONFIG ====================
const trackingSteps = [
  { key: "pending",       label: "Pending" }, //key from supabase order database // label display on tracking page
  { key: "ordered",       label: "Order Confirmed" },
  { key: "purchased",     label: "Purchased" },
  { key: "shipped",       label: "Shipped from India" },
  { key: "jaigaon",       label: "Arrived at Jaigaon" },
  { key: "phuentsholing", label: "Arrived at Phuentsholing" },
  { key: "delivery",      label: "Out for Delivery" },
  { key: "delivered",     label: "Delivered" }
];

function getPaymentStatus(order) {

  const total =
    Number(order.final_total || 0);

  const paid =
    Number(order.advance_paid || 0);

  if (!total) {
    return "Advance Pending";
  }

  if (paid <= 0) {
    return "Advance Pending";
  }

  if (paid >= total) {
    return "Paid";
  }

  return "Partially Paid";
}

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

// ==================== UTILITIES ====================
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

// ==================== MAIN FUNCTION ====================
async function searchOrder() {
  const orderIdEl = document.getElementById('orderId');
  const resultDiv = document.getElementById('result');
  const searchBtn = document.getElementById('searchBtn');

  let orderIdInput = orderIdEl.value.trim().toUpperCase();

  if (!orderIdInput) {
    alert("Please enter your Order ID");
    return;
  }

  resultDiv.classList.remove('hidden');
  resultDiv.innerHTML = `<p style="text-align:center; padding:60px 20px;">🔍 Searching for <strong>${orderIdInput}</strong>...</p>`;
  searchBtn.disabled = true;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderIdInput)
      .single();

    if (error || !data) {
      resultDiv.innerHTML = `<p style="text-align:center; color:#dc2626; padding:50px;">❌ Order ID <strong>${orderIdInput}</strong> not found.</p>`;
      return;
    }

    renderOrderTracking(data);

  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `<p style="text-align:center; color:#dc2626; padding:40px;">Something went wrong. Please try again.</p>`;
  } finally {
    searchBtn.disabled = false;
  }
}

// New function - Clean rendering
function renderOrderTracking(d) {
  const statusKey = (d.status || '').toLowerCase().trim();
  const currentIndex = trackingSteps.findIndex(step => step.key === statusKey);

  const stepsHTML = trackingSteps.map((step, index) => {
    const completed = index < currentIndex;
    const active = index === currentIndex;

    return `
      <div class="step-item ${completed ? 'completed' : ''} ${active ? 'active' : ''}">
        <div class="step-circle">
          ${completed ? '✓' : active ? '🚚' : index + 1}
        </div>
        <div class="step-label">${step.label}</div>
      </div>`;
  }).join('');

  // Calculate progress percentage for the line
  const progressPercent = currentIndex >= 0 ? Math.min(((currentIndex + 1) / trackingSteps.length) * 100, 100) : 10;

  const resultDiv = document.getElementById('result');
  resultDiv.classList.remove('hidden');

  resultDiv.innerHTML = `
    <div class="order-header">
      <div>
        <h3 style="margin:0; font-size:1.6rem;">${d.order_id}</h3>
      </div>
      <span class="status-badge">${d.status || 'Pending'}</span>
    </div>

    <div class="info-grid">
      <div><strong>Date:</strong> ${formatBTTime(d.created_at)}</div>
      <div><strong>City:</strong> ${d.delivery_city || '—'}</div>
      <div><strong>Customer:</strong> ${d.full_name || '—'}</div>
      <div>
        <strong>Payment:</strong> 
        <span style="color:var(--success); font-weight:600;">${getPaymentStatus(d)}</span>
      </div>
    </div>

    <div style="margin:24px 0;">
      <strong>Estimated Delivery:</strong> ${getEstimated(d)}
    </div>

    ${d.product_links ? `<div style="margin:20px 0;"><strong>Product:</strong><br><a href="${d.product_links}" target="_blank" style="color:var(--primary);">${d.product_links}</a></div>` : ''}

    ${d.screenshot_url ? `
      <div style="margin:28px 0;">
        <strong>Payment Proof</strong><br>
        <img src="${d.screenshot_url}" style="max-width:100%; border-radius:16px; margin-top:12px; box-shadow:0 10px 30px rgba(0,0,0,0.1);">
      </div>` : ''}

    <h4 style="margin:32px 0 16px;">Tracking Progress</h4>
    <div class="tracking-timeline" style="--progress: ${progressPercent}%;">
      ${stepsHTML}
    </div>

    ${d.remark ? `
      <div style="background:#f0f9ff; padding:20px; border-radius:16px; border-left:5px solid var(--primary);">
        <strong>Latest Update:</strong><br>
        ${d.remark}
      </div>` : ''}

    <button onclick="searchOrder()" style="margin-top:28px; width:100%; padding:14px; background:#64748b; color:white; border:none; border-radius:999px; cursor:pointer;">
      🔄 Refresh Status
    </button>
  `;

  // Trigger progress animation
  setTimeout(() => {
    document.querySelector('.tracking-timeline').style.setProperty('--progress', `${progressPercent}%`);
  }, 100);
}

// Initialize
window.searchOrder = searchOrder;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('orderId')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') searchOrder();
  });
});