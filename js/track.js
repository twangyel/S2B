import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://deecrnfbvgbzyybqhywy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8"
);

// ==================== TRACKING CONFIG ====================
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
  "pending":      "Awaiting confirmation",
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

    const d = data;
    const statusKey = (d.status || '').toLowerCase();
    const currentIndex = trackingSteps.findIndex(step => step.key === statusKey);

    const stepsHTML = trackingSteps.map((step, index) => {
      const completed = index < currentIndex;
      const active = index === currentIndex;

      return `
        <div class="step-item ${completed ? 'completed' : ''} ${active ? 'active' : ''}">
          <div class="step-circle">
            ${completed ? '✓' : active ? '🚚' : ''}
          </div>
          <div class="step-label">${step.label}</div>
        </div>`;
    }).join('');

    resultDiv.innerHTML = `
      <div style="background:#f8fafc; border:1.5px solid var(--border); border-radius:16px; padding:28px; margin-top:20px;">

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:24px;">
          <h3 style="margin:0;">${d.order_id}</h3>
          <span class="status-badge">${d.status}</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; font-size:0.97rem;">
          <div><strong>Date:</strong> ${formatBTTime(d.created_at)}</div>
          <div><strong>City:</strong> ${d.delivery_city || '—'}</div>
          <div><strong>Customer:</strong> ${d.full_name || '—'}</div>
          <div><strong>Status:</strong> <span style="color:var(--success); font-weight:600;">${d.status}</span></div>
        </div>

        <div style="margin-bottom:28px;">
          <strong>Estimated Delivery:</strong> ${getEstimated(d)}
        </div>

        ${d.product_links ? `
        <div style="margin-bottom:24px;">
          <strong>Product:</strong><br>
          <a href="${d.product_links}" target="_blank" style="color:var(--primary); word-break:break-all;">${d.product_links}</a>
        </div>` : ''}

        ${d.screenshot_url ? `
        <div style="margin-bottom:24px;">
          <strong>Proof:</strong><br>
          <img src="${d.screenshot_url}" alt="Proof" style="max-width:100%; border-radius:12px; margin-top:10px;">
        </div>` : ''}

        <div style="margin-top:32px;">
          <h4 style="margin-bottom:20px;">Tracking Progress</h4>
          <div class="tracking-timeline">
            ${stepsHTML}
          </div>
        </div>

        ${d.remark ? `
        <div style="margin-top:28px; padding:18px; background:#fff; border:1px solid var(--border); border-radius:12px;">
          <strong>Latest Update:</strong><br>${d.remark}
        </div>` : ''}

      </div>
    `;

  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `<p style="text-align:center; color:#dc2626; padding:40px;">Something went wrong. Please try again.</p>`;
  } finally {
    searchBtn.disabled = false;
  }
}

// Initialize
window.searchOrder = searchOrder;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('orderId')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') searchOrder();
  });
});