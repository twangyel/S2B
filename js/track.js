import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://deecrnfbvgbzyybqhywy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8"
);

// FIX: Display time in Bhutan timezone
function formatBTTime(date) {
  return new Date(date).toLocaleString("en-BT", {
    timeZone: "Asia/Thimphu",
    dateStyle: "medium",
    timeStyle: "short"
  });
}

const trackingSteps = [
  "Pending",
  "Order Confirmed",
  "Purchased",
  "Shipped",
  "Arrived at Jaigaon",
  "Arrived at Phuentsholing",
  "Out for Delivery",
  "Delivered"
];

// FIX: Single definition of getEstimated at module scope (removed duplicate inside searchOrder)
function getEstimated(status) {
  switch (status) {
    case "Pending":              return "Awaiting confirmation";
    case "Order Confirmed":      return "5-7 days";
    case "Purchased":            return "4-6 days";
    case "Shipped":              return "2-4 days";
    case "Arrived at Jaigaon":   return "1-2 days";
    case "Arrived at Phuentsholing": return "1 day";
    case "Out for Delivery":     return "Today";
    case "Delivered":            return "Completed";
    default:                     return "Processing";
  }
}

async function searchOrder() {
  const orderIdInput = document.getElementById('orderId').value.trim().toUpperCase();
  const resultDiv    = document.getElementById('result');
  const searchBtn    = document.getElementById('searchBtn');

  if (!orderIdInput) {
    alert("Please enter your Order ID");
    return;
  }

  resultDiv.classList.remove('hidden');
  resultDiv.innerHTML = `<p style="text-align:center; padding:40px;">Searching for <strong>${orderIdInput}</strong>…</p>`;
  searchBtn.disabled  = true;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderIdInput)
      .single();

    if (error || !data) {
      resultDiv.innerHTML = `<p style="text-align:center; color:#dc2626; padding:40px;">Order ID not found. Please check and try again.</p>`;
      return;
    }

    const d            = data;
    const currentIndex = trackingSteps.indexOf(d.status);

    const stepsHTML = trackingSteps.map((step, index) => `
      <div class="tracking-step" style="opacity:${index <= currentIndex ? '1' : '0.4'};">
        <div class="step-circle" style="background:${index <= currentIndex ? 'var(--success)' : '#cbd5e1'};">
          ${index <= currentIndex ? '✓' : ''}
        </div>
        <div style="font-weight:${index === currentIndex ? '700' : '500'};">
          ${step}
        </div>
      </div>
    `).join('');

    resultDiv.innerHTML = `
      <div style="background:#f8fafc; border:1.5px solid var(--border); border-radius:16px; padding:28px; margin-top:20px;">

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
          <h3 style="margin:0;">${d.order_id}</h3>
          <span class="status-badge" style="background:var(--success-bg); color:var(--success);">
            ${d.status || 'Processing'}
          </span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:0.98rem;">
          <div><strong>Date:</strong> ${formatBTTime(d.created_at)}</div>
          <div><strong>City:</strong> ${d.delivery_city || '—'}</div>
          <div><strong>Customer:</strong> ${d.full_name || '—'}</div>
          <div><strong>Status:</strong> <span style="color:var(--success);font-weight:600;">${d.status || '—'}</span></div>
        </div>

        <div style="margin-top:20px;">
          <strong>Estimated Delivery:</strong>
          ${getEstimated(d.status)}
        </div>

        ${d.product_link ? `
        <div style="margin-top:24px;">
          <strong>Product:</strong><br>
          <a href="${d.product_link}" target="_blank" rel="noopener noreferrer"
             style="word-break:break-all;">${d.product_link}</a>
        </div>` : ''}

        ${d.screenshot_url ? `
        <div style="margin-top:24px;">
          <strong>Proof:</strong><br>
          <img src="${d.screenshot_url}" alt="Order proof"
               style="max-width:100%; border-radius:12px; margin-top:10px;">
        </div>` : ''}

        <div style="margin-top:30px;">
          <h4 style="margin-bottom:16px;">Tracking Progress</h4>
          ${stepsHTML}
        </div>

        ${d.remark ? `
        <div style="margin-top:24px; padding:16px; background:#fff; border:1px solid var(--border); border-radius:12px;">
          <strong>Latest Update:</strong><br>${d.remark}
        </div>` : ''}

      </div>
    `;

  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `<p style="text-align:center; color:#dc2626; padding:40px;">Something went wrong. Please try again later.</p>`;
  } finally {
    searchBtn.disabled = false;
  }
}

document.getElementById('orderId').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') searchOrder();
});

window.searchOrder = searchOrder;