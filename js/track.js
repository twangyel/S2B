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

function getPaymentStatus(order) {
  const total = Number(order.final_total || 0);
  const paid = Number(order.advance_paid || 0);

  if (!total) return "Advance Pending";
  if (paid <= 0) return "Advance Pending";
  if (paid >= total) return "Paid";
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

// ==================== MODERN UI RENDERING ====================
function renderOrderTracking(d) {
  const statusKey = (d.status || '').toLowerCase().trim();
  const currentIndex = trackingSteps.findIndex(step => step.key === statusKey);
  const progressPercent = currentIndex >= 0 ? Math.min(((currentIndex + 1) / trackingSteps.length) * 100, 100) : 10;

  const stepsHTML = trackingSteps.map((step, index) => {
    const completed = index < currentIndex;
    const active = index === currentIndex;
    
    let icon = '';
    if (completed) icon = '✓';
    else if (active) icon = '🚚';
    else icon = index + 1;

    return `
      <div class="step-item ${completed ? 'completed' : ''} ${active ? 'active' : ''}">
        <div class="step-circle">${icon}</div>
        <div class="step-label">${step.label}</div>
      </div>`;
  }).join('');

  const resultDiv = document.getElementById('result');
  resultDiv.classList.remove('hidden');

  resultDiv.innerHTML = `
    <div class="order-card">
      <div class="order-header">
        <div class="order-title">
          <i class="fas fa-box"></i>
          <h3>${d.order_id}</h3>
        </div>
        <span class="status-badge ${d.status || 'pending'}">${d.status || 'Pending'}</span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <i class="fas fa-calendar"></i>
          <span class="info-label">Order Date</span>
          <strong>${formatBTTime(d.created_at)}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-map-marker-alt"></i>
          <span class="info-label">City</span>
          <strong>${d.delivery_city || '—'}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-user"></i>
          <span class="info-label">Customer</span>
          <strong>${d.full_name || '—'}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-credit-card"></i>
          <span class="info-label">Payment Status</span>
          <strong class="payment-status">${getPaymentStatus(d)}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-money-bill"></i>
          <span class="info-label">Due Amount</span>
          <strong class="due-amount">Nu. ${Number(d.due_amount || 0).toLocaleString()}</strong>
        </div>
        <div class="info-item">
          <i class="fas fa-truck"></i>
          <span class="info-label">Est. Delivery</span>
          <strong>${getEstimated(d)}</strong>
        </div>
      </div>

      ${d.product_links ? `
        <div class="product-section">
          <i class="fas fa-link"></i>
          <a href="${d.product_links}" target="_blank">${d.product_links}</a>
        </div>
      ` : ''}

      ${d.screenshot_url ? `
        <div class="screenshot-section">
          <i class="fas fa-image"></i>
          <strong>Payment Proof</strong>
          <img src="${d.screenshot_url}" alt="Payment Screenshot">
        </div>
      ` : ''}

      <div class="timeline-section">
        <h4><i class="fas fa-chart-line"></i> Tracking Progress</h4>
        <div class="tracking-timeline" style="--progress: ${progressPercent}%;">
          ${stepsHTML}
        </div>
      </div>

      ${d.remark ? `
        <div class="remark-section">
          <i class="fas fa-comment-dots"></i>
          <strong>Latest Update:</strong>
          <p>${d.remark}</p>
        </div>
      ` : ''}

      <button onclick="searchOrder()" class="refresh-btn">
        <i class="fas fa-sync-alt"></i> Refresh Status
      </button>
    </div>
  `;
}

// ==================== MAIN SEARCH FUNCTION ====================
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
}

// ==================== INJECT CSS STYLES ====================
function injectStyles() {
  const styles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 2rem 1rem;
      }

      .container {
        max-width: 1000px;
        margin: 0 auto;
      }

      /* Search Section */
      .search-section {
        background: white;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        margin-bottom: 2rem;
        text-align: center;
      }

      .search-section h2 {
        margin-bottom: 1rem;
        color: #333;
      }

      .search-box {
        display: flex;
        gap: 1rem;
        max-width: 500px;
        margin: 0 auto;
      }

      .search-box input {
        flex: 1;
        padding: 1rem 1.5rem;
        border: 2px solid #e0e0e0;
        border-radius: 50px;
        font-size: 1rem;
        transition: all 0.3s;
      }

      .search-box input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
      }

      .search-box button {
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .search-box button:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      .search-box button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Result Card */
      .order-card {
        background: white;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        animation: slideUp 0.4s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #f0f0f0;
      }

      .order-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .order-title i {
        font-size: 1.5rem;
        color: #667eea;
      }

      .order-title h3 {
        font-size: 1.5rem;
        color: #333;
      }

      .status-badge {
        padding: 0.5rem 1rem;
        border-radius: 50px;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.85rem;
      }

      .status-badge.pending { background: #fff3cd; color: #856404; }
      .status-badge.ordered { background: #d1ecf1; color: #0c5460; }
      .status-badge.purchased { background: #d4edda; color: #155724; }
      .status-badge.shipped { background: #d1ecf1; color: #0c5460; }
      .status-badge.delivery { background: #fff3cd; color: #856404; }
      .status-badge.delivered { background: #d4edda; color: #155724; }

      /* Info Grid */
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .info-item i {
        color: #667eea;
        font-size: 1.2rem;
      }

      .info-label {
        font-size: 0.85rem;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .payment-status {
        color: #28a745;
      }

      .due-amount {
        color: #dc3545;
      }

      /* Product & Screenshot */
      .product-section, .screenshot-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 12px;
      }

      .product-section a {
        color: #667eea;
        text-decoration: none;
        word-break: break-all;
      }

      .screenshot-section img {
        max-width: 100%;
        border-radius: 12px;
        margin-top: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      /* Timeline */
      .timeline-section {
        margin: 2rem 0;
      }

      .timeline-section h4 {
        margin-bottom: 1.5rem;
        color: #333;
      }

      .timeline-section h4 i {
        color: #667eea;
        margin-right: 0.5rem;
      }

      .tracking-timeline {
        display: flex;
        justify-content: space-between;
        position: relative;
        padding: 1rem 0;
      }

      .tracking-timeline::before {
        content: '';
        position: absolute;
        top: 28px;
        left: 0;
        right: 0;
        height: 3px;
        background: #e0e0e0;
        z-index: 0;
      }

      .tracking-timeline::after {
        content: '';
        position: absolute;
        top: 28px;
        left: 0;
        width: var(--progress, 0%);
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        z-index: 1;
        transition: width 0.5s ease;
      }

      .step-item {
        flex: 1;
        text-align: center;
        position: relative;
        z-index: 2;
      }

      .step-circle {
        width: 56px;
        height: 56px;
        background: white;
        border: 3px solid #e0e0e0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.75rem;
        font-weight: bold;
        font-size: 1.1rem;
        transition: all 0.3s;
      }

      .step-item.completed .step-circle {
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-color: #667eea;
        color: white;
      }

      .step-item.active .step-circle {
        border-color: #667eea;
        background: white;
        color: #667eea;
        box-shadow: 0 0 0 5px rgba(102,126,234,0.2);
        transform: scale(1.1);
      }

      .step-label {
        font-size: 0.75rem;
        color: #666;
        font-weight: 500;
      }

      .step-item.completed .step-label {
        color: #667eea;
        font-weight: 600;
      }

      .step-item.active .step-label {
        color: #333;
        font-weight: 700;
      }

      /* Remark */
      .remark-section {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        padding: 1rem;
        border-radius: 12px;
        margin: 1rem 0;
      }

      /* Refresh Button */
      .refresh-btn {
        width: 100%;
        padding: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
        margin-top: 1rem;
      }

      .refresh-btn:hover {
        transform: translateY(-2px);
      }

      /* States */
      .loading-state, .error-state {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 20px;
      }

      .loading-state i, .error-state i {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .error-state {
        color: #dc3545;
      }

      .hidden {
        display: none;
      }

      @media (max-width: 768px) {
        .search-box {
          flex-direction: column;
        }
        
        .tracking-timeline {
          overflow-x: auto;
          min-width: 600px;
        }
        
        .step-circle {
          width: 40px;
          height: 40px;
          font-size: 0.9rem;
        }
      }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

// ==================== INITIALIZE UI ====================
function initializeUI() {
  // Inject Font Awesome
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
    document.head.appendChild(fontAwesome);
  }
  
  injectStyles();
  
  // Create main container if doesn't exist
  if (!document.querySelector('.container')) {
    const container = document.createElement('div');
    container.className = 'container';
    
    container.innerHTML = `
      <div class="search-section">
        <h2><i class="fas fa-search"></i> Track Your Order</h2>
        <div class="search-box">
          <input type="text" id="orderId" placeholder="Enter Order ID (e.g., ORD-12345)" autocomplete="off">
          <button id="searchBtn"><i class="fas fa-truck"></i> Track Order</button>
        </div>
      </div>
      <div id="result" class="hidden"></div>
    `;
    
    document.body.innerHTML = '';
    document.body.appendChild(container);
  }
  
  // Attach event listeners
  const orderIdInput = document.getElementById('orderId');
  const searchBtn = document.getElementById('searchBtn');
  
  if (orderIdInput) {
    orderIdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchOrder();
    });
  }
  
  if (searchBtn) {
    searchBtn.addEventListener('click', searchOrder);
  }
}

// Make searchOrder globally available
window.searchOrder = searchOrder;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}