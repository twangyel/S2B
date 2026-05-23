import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://deecrnfbvgbzyybqhywy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allReviews = [];
let reviewsLoaded = false;
let deleteTargetId = null;

let allOrders = [];
let allQuotations = [];
let ordersLoaded = false;
let quotationsLoaded = false;
let allPayments = [];
let paymentsLoaded = false;
let allOtpCodes = [];
let allPortalUsers = [];
let portalLoaded = false;
let otpCodesLoaded = false;
let portalUsersLoaded = false;
let currentPortalSubTab = 'otp';
let currentOrderSubTab = 'orders';
let authChecked = false;

/* ==========================================================
   VERIFY MODAL STATE
   ========================================================== */
let verifyState = null; // holds the pending verify action data

/* ==========================================================
   AUTH & INIT
   ========================================================== */
async function init() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.replace('/admin-login.html');
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      window.location.replace('/admin-login.html');
      return;
    }

    authChecked = true;

    const navEmail = document.getElementById('admin-email-nav');
    if (navEmail) navEmail.textContent = session.user.email;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.replace('/admin-login.html');
    });

    updateTabVisuals(0);
    setupSearch();
    setupOrderSearch();
    setupPaymentSearch();
    setupUserSearch();
    initNotifications();

  } catch (err) {
    console.error('Init error:', err);
    if (!authChecked) window.location.replace('/admin-login.html');
  }
}

/* ==========================================================
   TAB VISUALS
   ========================================================== */
function updateTabVisuals(index) {
  [0, 1, 2, 3].forEach(i => {
    const btn = document.getElementById(`tab-${i}`);
    const pane = document.getElementById(`content-${i}`);
    if (!btn || !pane) return;

    if (i === index) {
      btn.classList.add('tab-active');
      btn.classList.replace('border-transparent', 'border-indigo-600');
      pane.classList.remove('hidden');
    } else {
      btn.classList.remove('tab-active');
      btn.classList.replace('border-indigo-600', 'border-transparent');
      pane.classList.add('hidden');
    }
  });
}

/* ==========================================================
   TAB SWITCHING
   ========================================================== */
function switchTab(index) {
  if (!authChecked) return;
  updateTabVisuals(index);
  if (index === 0 && !reviewsLoaded) loadReviews();
  if (index === 1 && !ordersLoaded) loadOrders();
  if (index === 2) { /* Analytics - already has placeholder */ }
  if (index === 3 && !portalLoaded) loadPortal();
}
window.switchTab = switchTab;

/* ==========================================================
   REVIEWS
   ========================================================== */
async function loadReviews() {
  const loader = document.getElementById('reviews-loader');
  const empty = document.getElementById('reviews-empty');
  const wrap = document.getElementById('reviews-table-wrap');
  const tbody = document.getElementById('reviews-tbody');
  if (!tbody) return;

  loader?.classList.remove('hidden');
  empty?.classList.add('hidden');
  wrap?.classList.add('hidden');

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, full_name, city, rating, message, is_approved, order_id, is_verified_buyer, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allReviews = data || [];
    reviewsLoaded = true;
    loader?.classList.add('hidden');

    if (allReviews.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }

    renderReviews(allReviews);
    wrap?.classList.remove('hidden');
  } catch (err) {
    console.error('Load reviews failed:', err);
    loader?.classList.add('hidden');
    tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-12 text-center text-red-500 text-sm">${err.message || 'Failed to load reviews'}</td></tr>`;
    wrap?.classList.remove('hidden');
    showToast('Failed to load reviews', 'error');
  }
}
window.loadReviews = loadReviews;

async function refreshReviews() {
  reviewsLoaded = false;
  await loadReviews();
}
window.refreshReviews = refreshReviews;

function renderReviews(reviews) {
  const tbody = document.getElementById('reviews-tbody');
  if (!tbody) return;

  tbody.innerHTML = reviews.map(r => {
    const name = r.full_name || 'Anonymous';
    const city = r.city || '';
    const orderId = r.order_id ? String(r.order_id).slice(0, 12) : '-';
    const message = r.message || '';
    const rating = Math.max(0, Math.min(5, parseInt(r.rating) || 0));
    const isApproved = r.is_approved === true;
    const isVerified = r.is_verified_buyer === true;
    const date = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

    const stars = Array(5).fill(0).map((_, i) =>
      `<i class="fas fa-star ${i < rating ? 'text-yellow-400' : 'text-gray-200'} text-[10px]"></i>`
    ).join('');

    return `
      <tr class="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">
              ${name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="font-semibold text-gray-900 text-sm">${esc(name)}</div>
              ${city ? `<div class="text-xs text-gray-400">${esc(city)}</div>` : ''}
            </div>
          </div>
        </td>
        <td class="px-6 py-4"><code class="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">${esc(orderId)}</code></td>
        <td class="px-6 py-4"><div class="flex items-center gap-1">${stars}<span class="text-xs text-gray-400 ml-1 font-semibold">${rating}</span></div></td>
        <td class="px-6 py-4 max-w-xs"><p class="text-gray-600 text-sm leading-relaxed line-clamp-2" title="${esc(message)}">${esc(message) || '-'}</p></td>
        <td class="px-6 py-4">${isVerified ? `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide"><i class="fas fa-check-circle text-[9px]"></i> Verified</span>` : `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wide">Guest</span>`}</td>
        <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}"><span class="w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}"></span>${isApproved ? 'Approved' : 'Pending'}</span></td>
        <td class="px-6 py-4 text-gray-500 text-xs font-medium whitespace-nowrap">${date}</td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button onclick="window.toggleApproval('${r.id}', ${isApproved})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isApproved ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100'}" title="${isApproved ? 'Unapprove' : 'Approve'}"><i class="fas ${isApproved ? 'fa-times-circle' : 'fa-check-circle'}"></i>${isApproved ? 'Unapprove' : 'Approve'}</button>
            <button onclick="window.showDeleteModal('${r.id}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors" title="Delete"><i class="fas fa-trash-alt text-xs"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

async function toggleApproval(id, currentState) {
  const newState = !currentState;
  try {
    const { error } = await supabase.from('reviews').update({ is_approved: newState }).eq('id', id);
    if (error) throw error;
    showToast(newState ? 'Review approved' : 'Review unapproved', 'success');
    await refreshReviews();
  } catch (err) {
    console.error('Toggle failed:', err);
    showToast('Failed to update status', 'error');
  }
}
window.toggleApproval = toggleApproval;

/* ==========================================================
   DELETE REVIEW
   ========================================================== */
function showDeleteModal(id) {
  deleteTargetId = id;
  const modal = document.getElementById('delete-modal');
  const content = document.getElementById('delete-modal-content');
  if (!modal) return;
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });
}
window.showDeleteModal = showDeleteModal;

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    const content = modal.querySelector('div[id$="-content"]');
    modal.classList.remove('opacity-100');
    content?.classList.remove('scale-100');
    content?.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
  });
}
window.closeAllModals = closeAllModals;

async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('confirm-delete-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Deleting...'; }
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', deleteTargetId);
    if (error) throw error;
    closeAllModals();
    showToast('Review deleted', 'success');
    await refreshReviews();
  } catch (err) {
    console.error('Delete failed:', err);
    showToast('Failed to delete review', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Delete'; }
    deleteTargetId = null;
  }
}

/* ==========================================================
   ORDERS & QUOTATIONS & PAYMENTS
   ========================================================== */
function switchOrderSubTab(tab) {
  currentOrderSubTab = tab;
  ['orders', 'quotations', 'payments'].forEach(t => {
    const btn = document.getElementById(`subtab-${t}`);
    const panel = document.getElementById(`panel-${t}`);
    if (!btn || !panel) return;
    if (t === tab) {
      btn.classList.add('subtab-active', 'border-indigo-600', 'text-indigo-700');
      btn.classList.remove('border-transparent', 'text-gray-500');
      panel.classList.remove('hidden');
    } else {
      btn.classList.remove('subtab-active', 'border-indigo-600', 'text-indigo-700');
      btn.classList.add('border-transparent', 'text-gray-500');
      panel.classList.add('hidden');
    }
  });
  if (tab === 'orders' && !ordersLoaded) loadOrders();
  if (tab === 'quotations' && !quotationsLoaded) loadQuotations();
  if (tab === 'payments' && !paymentsLoaded) loadPayments();
}
window.switchOrderSubTab = switchOrderSubTab;

async function loadOrders() {
  const loader = document.getElementById('orders-loader');
  const empty = document.getElementById('orders-empty');
  const wrap = document.getElementById('orders-table-wrap');
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  loader?.classList.remove('hidden');
  empty?.classList.add('hidden');
  wrap?.classList.add('hidden');

  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_id, user_id, delivery_city, delivery_address, product_links, quantities, screenshot_url, order_status, total_amount, payment_method, created_at, users(full_name, whatsapp, email)')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('order_id, payment_method, status, total_amount');

    if (paymentsError) console.warn('Payments fetch warning:', paymentsError);

    const { data: quotesData, error: quotesError } = await supabase
      .from('quotations')
      .select('order_id, status');

    if (quotesError) console.warn('Quotations fetch warning:', quotesError);

    allQuotations = quotesData || [];

    const paymentMap = {};
    (paymentsData || []).forEach(p => {
      if (p.order_id) paymentMap[p.order_id] = p;
    });

    allOrders = (ordersData || []).map(o => ({
      ...o,
      _payment: paymentMap[o.order_id] || null
    }));

    ordersLoaded = true;
    loader?.classList.add('hidden');

    if (allOrders.length === 0) {
      empty?.classList.remove('hidden');
      wrap?.classList.add('hidden');
      return;
    }

    empty?.classList.add('hidden');
    renderOrders(allOrders);
    wrap?.classList.remove('hidden');
  } catch (err) {
    console.error('Load orders failed:', err);
    loader?.classList.add('hidden');
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-red-500 text-sm">${err.message || 'Failed to load orders'}</td></tr>`;
    wrap?.classList.remove('hidden');
    showToast('Failed to load orders', 'error');
  }
}
window.loadOrders = loadOrders;

async function refreshOrders() {
  ordersLoaded = false;
  await loadOrders();
}
window.refreshOrders = refreshOrders;

function renderOrders(orders) {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  const statusDisplayMap = {
    pending: 'Awaiting Payment Confirmation',
    quoted: 'Quotation Sent',
    confirmed: 'Payment Confirmed',
    ordered: 'Ordered with Seller',
    reached_jaigaon: 'Reached Jaigaon',
    reached_phuntsholing: 'Reached Phuntsholing',
    out_for_delivery: 'Out for Delivery',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

  tbody.innerHTML = orders.map(o => {
    const user = o.users || {};
    const name = user.full_name || '—';
    const phone = user.whatsapp || '—';
    const city = o.delivery_city || '—';
    const links = safeParseArray(o.product_links);
    const productCount = links.length;
    const qtys = safeParseArray(o.quantities);

    const status = o.order_status || 'pending';
    const hasQuote = allQuotations.some(q => q.order_id === o.id);
    const paymentData = o._payment || {};
    const paymentMethod = paymentData.payment_method || o.payment_method || '—';
    const screenshots = safeParseArray(o.screenshot_url);

    const statusColors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      quoted: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
      ordered: 'bg-sky-50 text-sky-700 border-sky-100',
      reached_jaigaon: 'bg-teal-50 text-teal-700 border-teal-100',
      reached_phuntsholing: 'bg-cyan-50 text-cyan-700 border-cyan-100',
      out_for_delivery: 'bg-violet-50 text-violet-700 border-violet-100',
      shipped: 'bg-purple-50 text-purple-700 border-purple-100',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      cancelled: 'bg-red-50 text-red-700 border-red-100'
    };

    const detailsHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Address</h4>
          <p class="text-sm text-gray-800 bg-white rounded-lg p-3 border border-gray-200">${esc(o.delivery_address || '—')}</p>
        </div>
        <div>
          <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact</h4>
          <p class="text-sm text-gray-800 bg-white rounded-lg p-3 border border-gray-200">
            ${esc(name)}<<br>
            <span class="text-gray-500">+975 ${esc(phone)}</span>
          </p>
        </div>
        <div class="md:col-span-2">
          <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Products (${productCount})</h4>
          <div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            ${links.map((link, i) => `
              <div class="px-3 py-2 flex items-center justify-between text-sm">
                <a href="${esc(link)}" target="_blank" class="text-indigo-600 hover:underline truncate max-w-[70%]">${esc(link)}</a>
                <span class="text-xs text-gray-500 font-medium">Qty: ${esc(String(qtys[i] || 1))}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ${screenshots.length > 0 ? `
        <div class="md:col-span-2">
          <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Screenshots</h4>
          <div class="flex gap-2 flex-wrap">
            ${screenshots.map(url => `
              <a href="${esc(url)}" target="_blank" class="block w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity">
                <img src="${esc(url)}" class="w-full h-full object-cover" onerror="this.parentElement.style.display='none'">
              </a>
            `).join('')}
          </div>
        </div>` : ''}
      </div>
    `;

    return `
      <tr class="hover:bg-gray-50/80 transition-colors group border-b border-gray-50" id="order-row-${o.id}">
        <td class="px-6 py-4"><code class="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded font-semibold">${esc(o.order_id || '—')}</code></td>
        <td class="px-6 py-4"><div class="font-semibold text-gray-900 text-sm">${esc(name)}</div><div class="text-xs text-gray-400 mt-0.5">+975 ${esc(phone)}</div></td>
        <td class="px-6 py-4 text-sm text-gray-700">${esc(city)}</td>
        <td class="px-6 py-4 text-sm text-gray-700"><span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium"><i class="fas fa-box text-[10px]"></i> ${productCount} item${productCount !== 1 ? 's' : ''}</span></td>
        <td class="px-6 py-4 text-sm text-gray-700"><span class="text-xs text-gray-500">${esc(paymentMethod)}</span></td>
        <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors.pending}"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>${statusDisplayMap[status] || status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button onclick="window.openQuoteModal('${o.id}', '${esc(o.order_id || '')}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${hasQuote ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100' : 'text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600'}" title="${hasQuote ? 'Edit Quotation' : 'Create Quotation'}"><i class="fas ${hasQuote ? 'fa-pen' : 'fa-plus'}"></i> ${hasQuote ? 'Edit Quote' : 'Quote'}</button>
            ${canUpdateTracking(o)
              ? `<button onclick="window.openTrackingModal('${o.id}', '${esc(o.order_id || '')}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" title="Update Tracking"><i class="fas fa-truck-fast text-xs"></i></button>`
              : `<button disabled class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 cursor-not-allowed" title="Tracking available after payment confirmation"><i class="fas fa-truck-fast text-xs"></i></button>`
            }
            <button onclick="window.viewOrderDetails('${o.id}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors" title="View Details"><i class="fas fa-eye text-xs"></i></button>
          </div>
        </td>
      </tr>
      <tr class="hidden bg-gray-50/50" id="order-details-${o.id}">
        <td colspan="7" class="px-6 py-5 border-b border-gray-100">
          ${detailsHtml}
        </td>
      </tr>`;
  }).join('');
}

function setupSearch() {
  const input = document.getElementById('review-search');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) { renderReviews(allReviews); return; }
    const filtered = allReviews.filter(r => {
      return [r.full_name, r.city, r.order_id, r.message].join(' ').toLowerCase().includes(term);
    });
    renderReviews(filtered);
  });
}

function setupOrderSearch() {
  const input = document.getElementById('order-search');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) { renderOrders(allOrders); return; }
    const filtered = allOrders.filter(o => {
      const u = o.users || {};
      return [o.order_id, u.full_name, u.whatsapp, o.delivery_city, o.order_status].join(' ').toLowerCase().includes(term);
    });
    renderOrders(filtered);
  });
}

function setupPaymentSearch() {
  const input = document.getElementById('payment-search');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) { renderPayments(allPayments); return; }
    const filtered = allPayments.filter(p => {
      const o = p.orders || {};
      const u = o.users || {};
      return [o.order_id, u.full_name, u.whatsapp, p.payment_method, p.status].join(' ').toLowerCase().includes(term);
    });
    renderPayments(filtered);
  });
}

function setupUserSearch() {
  const input = document.getElementById('user-search');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) { renderPortalUsers(allPortalUsers, []); return; }
    const filtered = allPortalUsers.filter(u => {
      return [u.full_name, u.whatsapp, u.email].join(' ').toLowerCase().includes(term);
    });
    renderPortalUsers(filtered, []);
  });
}

/* ==========================================================
   QUOTATION MODAL
   ========================================================== */
function openQuoteModal(orderUuid, orderTextId) {
  const order = allOrders.find(o => o.id === orderUuid);
  if (!order) return;

  document.getElementById('quote-order-id').value = orderUuid;
  document.getElementById('quote-order-text-id').value = orderTextId || '';
  document.getElementById('quote-modal-subtitle').textContent = `Order: ${orderTextId || orderUuid.slice(0, 8)}`;

  const cityFees = { Thimphu: 350, Phuntsholing: 150, Paro: 400 };
  const deliveryFee = cityFees[order.delivery_city] || 0;
  document.getElementById('quote-delivery').value = deliveryFee;

  const existing = allQuotations.find(q => q.order_id === orderUuid);
  if (existing) {
    document.getElementById('quote-product-price').value = existing.product_price || '';
    document.getElementById('quote-shipping').value = existing.shipping_fee || '';
    document.getElementById('quote-service').value = existing.service_fee || '';
    document.getElementById('quote-delivery').value = existing.delivery_fee || '';
    document.getElementById('quote-note').value = existing.note || '';
    document.getElementById('save-quote-btn').textContent = 'Update Quotation';
  } else {
    document.getElementById('quote-product-price').value = '';
    document.getElementById('quote-shipping').value = '';
    document.getElementById('quote-service').value = '';
    document.getElementById('quote-note').value = '';
    document.getElementById('save-quote-btn').textContent = 'Send Quotation';
  }

  autoCalculateServiceFee();
  updateQuoteTotal();

  const modal = document.getElementById('quote-modal');
  const content = document.getElementById('quote-modal-content');
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });
}
window.openQuoteModal = openQuoteModal;

function closeQuoteModal() {
  const modal = document.getElementById('quote-modal');
  const content = document.getElementById('quote-modal-content');

  modal.style.pointerEvents = 'none';
  content.style.pointerEvents = 'none';

  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');

  setTimeout(() => {
    modal.classList.add('hidden');
    modal.style.pointerEvents = '';
    content.style.pointerEvents = '';
  }, 200);
}
window.closeQuoteModal = closeQuoteModal;

['quote-product-price', 'quote-shipping', 'quote-delivery'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    autoCalculateServiceFee();
    updateQuoteTotal();
  });
});

document.getElementById('quote-service')?.addEventListener('input', updateQuoteTotal);

function autoCalculateServiceFee() {
  const productPrice = parseFloat(document.getElementById('quote-product-price')?.value) || 0;
  const rate = productPrice < 2000 ? 0.15 : productPrice <= 5999 ? 0.10 : 0.08;
  const serviceFee = Math.round(productPrice * rate);
  document.getElementById('quote-service').value = serviceFee;
}

function updateQuoteTotal() {
  const product = parseFloat(document.getElementById('quote-product-price')?.value) || 0;
  const shipping = parseFloat(document.getElementById('quote-shipping')?.value) || 0;
  const service = parseFloat(document.getElementById('quote-service')?.value) || 0;
  const delivery = parseFloat(document.getElementById('quote-delivery')?.value) || 0;
  document.getElementById('quote-total-display').textContent = '₹ ' + (product + shipping + service + delivery).toLocaleString('en-IN');
}

async function saveQuotation() {
  const orderUuid = document.getElementById('quote-order-id').value;
  const productPrice = parseFloat(document.getElementById('quote-product-price').value) || 0;
  const shipping = parseFloat(document.getElementById('quote-shipping').value) || 0;
  const service = parseFloat(document.getElementById('quote-service').value) || 0;
  const delivery = parseFloat(document.getElementById('quote-delivery').value) || 0;
  const note = document.getElementById('quote-note').value.trim();
  const total = Math.round(productPrice + shipping + service + delivery);

  if (productPrice <= 0) {
    showToast('Product price is required', 'error');
    return;
  }

  const btn = document.getElementById('save-quote-btn');
  if (btn.disabled) return;

  btn.disabled = true;
  btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
  btn.textContent = 'Saving...';

  const modalContent = document.getElementById('quote-modal-content');
  modalContent.style.pointerEvents = 'none';

  try {
    const { data: existing } = await supabase.from('quotations').select('id, status').eq('order_id', orderUuid).maybeSingle();

    const payload = {
      order_id: orderUuid,
      product_price: Math.round(productPrice),
      shipping_fee: Math.round(shipping),
      service_fee: Math.round(service),
      delivery_fee: Math.round(delivery),
      total_amount: total,
      note: note || null,
      updated_at: new Date().toISOString()
    };

    let error;
    if (existing) {
      payload.status = existing.status || 'pending';
      ({ error } = await supabase.from('quotations').update(payload).eq('id', existing.id));
    } else {
      payload.status = 'pending';
      payload.created_at = new Date().toISOString();
      ({ error } = await supabase.from('quotations').insert([payload]));
    }
    if (error) throw error;

    await supabase.from('orders').update({ order_status: 'quoted' }).eq('id', orderUuid);

    const orderTextId = document.getElementById('quote-order-text-id').value;

    const { data: paymentExists } = await supabase
      .from('payments')
      .select('id')
      .eq('order_id', orderTextId)
      .maybeSingle();

    if (paymentExists) {
      await supabase.from('payments').update({
        product_price: Math.round(productPrice),
        shipping_fee: Math.round(shipping),
        service_fee: Math.round(service),
        delivery_fee: Math.round(delivery),
        total_amount: total,
        updated_at: new Date().toISOString()
      }).eq('order_id', orderTextId);
    }

    const existingQuote = allQuotations.find(q => q.order_id === orderUuid);
    if (existingQuote) {
      existingQuote.product_price = Math.round(productPrice);
      existingQuote.shipping_fee = Math.round(shipping);
      existingQuote.service_fee = Math.round(service);
      existingQuote.delivery_fee = Math.round(delivery);
      existingQuote.total_amount = total;
      existingQuote.note = note || null;
      existingQuote.status = existingQuote.status || 'pending';
    } else {
      allQuotations.push({
        order_id: orderUuid,
        product_price: Math.round(productPrice),
        shipping_fee: Math.round(shipping),
        service_fee: Math.round(service),
        delivery_fee: Math.round(delivery),
        total_amount: total,
        note: note || null,
        status: 'pending'
      });
    }
    const orderIdx = allOrders.findIndex(o => o.id === orderUuid);
    if (orderIdx >= 0) {
      allOrders[orderIdx].order_status = 'quoted';
    }

    closeQuoteModal();
    showToast('Quotation saved successfully', 'success');
    renderOrders(allOrders);
    if (currentOrderSubTab === 'quotations') renderQuotations(allQuotations);
    if (currentOrderSubTab === 'payments') renderPayments(allPayments);
    await refreshQuotations();
    await refreshOrders();
  } catch (err) {
    console.error('Save quotation failed:', err);
    showToast('Failed to save quotation: ' + err.message, 'error');
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText;
      modalContent.style.pointerEvents = '';
      delete btn.dataset.originalText;
    }, 300);
  }
}
window.saveQuotation = saveQuotation;

/* ==========================================================
   QUOTATIONS LIST
   ========================================================== */
async function loadQuotations() {
  const loader = document.getElementById('quotations-loader');
  const empty = document.getElementById('quotations-empty');
  const wrap = document.getElementById('quotations-table-wrap');
  const tbody = document.getElementById('quotations-tbody');
  if (!tbody) return;

  loader?.classList.remove('hidden');
  empty?.classList.add('hidden');
  wrap?.classList.add('hidden');

  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*, orders!left(id, order_id, users(full_name))')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allQuotations = data || [];
    quotationsLoaded = true;
    loader?.classList.add('hidden');

    if (allQuotations.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }

    renderQuotations(allQuotations);
    wrap?.classList.remove('hidden');
  } catch (err) {
    console.error('Load quotations failed:', err);
    loader?.classList.add('hidden');
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-red-500 text-sm">${err.message || 'Failed to load quotations'}</td></tr>`;
    wrap?.classList.remove('hidden');
    showToast('Failed to load quotations', 'error');
  }
}
window.loadQuotations = loadQuotations;

async function refreshQuotations() {
  quotationsLoaded = false;
  await loadQuotations();
}
window.refreshQuotations = refreshQuotations;

function renderQuotations(quotes) {
  const tbody = document.getElementById('quotations-tbody');
  if (!tbody) return;

  const statusDisplayMap = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected'
  };

  tbody.innerHTML = quotes.map(q => {
    const order = q.orders || {};
    const user = order.users || {};
    const name = user.full_name || '—';
    const status = q.status || 'pending';
    const date = q.created_at ? new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

    const statusColors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      accepted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      rejected: 'bg-red-50 text-red-700 border-red-100'
    };

    return `
      <tr class="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
        <td class="px-6 py-4"><code class="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded font-semibold">${esc(order.order_id || '—')}</code></td>
        <td class="px-6 py-4"><div class="font-semibold text-gray-900 text-sm">${esc(name)}</div></td>
        <td class="px-6 py-4 text-sm text-gray-700">₹${Math.round(q.product_price || 0).toLocaleString('en-IN')}</td>
        <td class="px-6 py-4 text-sm font-semibold text-gray-900">₹${Math.round(q.total_amount || 0).toLocaleString('en-IN')}</td>
        <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors.pending}"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>${statusDisplayMap[status] || status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
        <td class="px-6 py-4 text-gray-500 text-xs font-medium whitespace-nowrap">${date}</td>
        <td class="px-6 py-4 text-right"><button onclick="window.openQuoteModal('${q.order_id}', '${esc(order.order_id || '')}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors ml-auto" title="Edit Quotation"><i class="fas fa-pen text-xs"></i></button></td>
      </tr>`;
  }).join('');
}

/* ==========================================================
   PAYMENTS  (50% ADVANCE + FULL PAYMENT + COD LOGIC)
   ========================================================== */
async function loadPayments() {
  const loader = document.getElementById('payments-loader');
  const empty = document.getElementById('payments-empty');
  const wrap = document.getElementById('payments-table-wrap');
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;

  loader?.classList.remove('hidden');
  empty?.classList.add('hidden');
  wrap?.classList.add('hidden');

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, orders!inner(id, order_id, users(full_name, whatsapp))')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allPayments = data || [];
    paymentsLoaded = true;
    loader?.classList.add('hidden');

    if (allPayments.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }

    renderPayments(allPayments);
    wrap?.classList.remove('hidden');
  } catch (err) {
    console.error('Load payments failed:', err);
    loader?.classList.add('hidden');
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-red-500 text-sm">${err.message || 'Failed to load payments'}</td></tr>`;
    wrap?.classList.remove('hidden');
    showToast('Failed to load payments', 'error');
  }
}
window.loadPayments = loadPayments;

async function refreshPayments() {
  paymentsLoaded = false;
  await loadPayments();
}
window.refreshPayments = refreshPayments;

function renderPayments(payments) {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;

  const statusDisplayMap = {
    pending: 'Pending',
    partial: 'Partially Paid',
    verified: 'Verified',
    refunded: 'Refunded'
  };

  tbody.innerHTML = payments.map(p => {
    const order = p.orders || {};
    const user = order.users || {};
    const name = user.full_name || '—';
    const phone = user.whatsapp || '';
    const status = p.status || 'pending';
    const date = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const method = p.payment_method || '—';

    const statusColors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      partial: 'bg-blue-50 text-blue-700 border-blue-100',
      verified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      refunded: 'bg-gray-50 text-gray-600 border-gray-200'
    };

    const isPending = status === 'pending';
    const isPartial = status === 'partial';
    const isFullPayment = method === 'Full Payment';
    const isCod = method === 'Cash on Delivery';
    const total = p.total_amount || 0;
    const advance = p.advance_paid || 0;
    const due = p.due_amount || 0;
    const deliveryFee = p.delivery_fee || 0;

    const hasQuotation = total > deliveryFee;

    let extraInfo = '';
    if (!hasQuotation && isPending) {
      extraInfo = `<div class="text-xs text-gray-500 mt-0.5">Awaiting quotation</div>`;
    } else if (isPending && isFullPayment) {
      extraInfo = `<div class="text-xs text-amber-600 mt-0.5">Full Payment: ₹${Math.round(total).toLocaleString('en-IN')}</div>`;
    } else if (isPending && isCod) {
      extraInfo = `<div class="text-xs text-gray-500 mt-0.5">Cash on Delivery</div>`;
    } else if (isPending) {
      extraInfo = `<div class="text-xs text-amber-600 mt-0.5">Advance (50%): ₹${Math.round(total * 0.5).toLocaleString('en-IN')}</div>`;
    } else if (isPartial) {
      extraInfo = `<div class="text-xs text-blue-600 mt-0.5">Paid: ₹${Math.round(advance).toLocaleString('en-IN')} | Due: ₹${Math.round(due).toLocaleString('en-IN')}</div>`;
    }

    let actionBtn = '';
    if (!hasQuotation && isPending) {
      actionBtn = `<span class="text-xs text-gray-400 font-medium"><i class="fas fa-clock mr-1"></i>Awaiting quote</span>`;
    } else if (isPending && isFullPayment) {
      actionBtn = `<button onclick="window.verifyPayment('${p.id}', '${order.id}', '${esc(order.order_id || '')}', '${esc(phone)}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 shadow-sm" title="Verify Full Payment"><i class="fas fa-check-double"></i> Verify Full</button>`;
    } else if (isPending && isCod) {
      actionBtn = `<button onclick="window.verifyPayment('${p.id}', '${order.id}', '${esc(order.order_id || '')}', '${esc(phone)}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white bg-gray-600 hover:bg-gray-700 border border-gray-600 shadow-sm" title="Confirm COD"><i class="fas fa-check"></i> Confirm COD</button>`;
    } else if (isPending) {
      actionBtn = `<button onclick="window.verifyPayment('${p.id}', '${order.id}', '${esc(order.order_id || '')}', '${esc(phone)}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 shadow-sm" title="Verify 50% Advance"><i class="fas fa-check"></i> Verify 50%</button>`;
    } else if (isPartial) {
      actionBtn = `<button onclick="window.verifyPayment('${p.id}', '${order.id}', '${esc(order.order_id || '')}', '${esc(phone)}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 shadow-sm" title="Verify Full Payment"><i class="fas fa-check-double"></i> Verify Full</button>`;
    } else if (status === 'verified') {
      actionBtn = `<span class="text-xs text-gray-400 font-medium"><i class="fas fa-check-circle text-emerald-500 mr-1"></i>Verified</span>`;
    }

    return `
      <tr class="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
        <td class="px-6 py-4"><code class="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded font-semibold">${esc(order.order_id || '—')}</code></td>
        <td class="px-6 py-4"><div class="font-semibold text-gray-900 text-sm">${esc(name)}</div><div class="text-xs text-gray-400 mt-0.5">+975 ${esc(phone || '—')}</div></td>
        <td class="px-6 py-4 text-sm text-gray-700"><span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">${esc(method)}</span></td>
        <td class="px-6 py-4 text-sm text-gray-700">
          <div class="font-semibold text-gray-900">₹${Math.round(total).toLocaleString('en-IN')}</div>
          ${extraInfo}
        </td>
        <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors.pending}"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>${statusDisplayMap[status] || status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
        <td class="px-6 py-4 text-gray-500 text-xs font-medium whitespace-nowrap">${date}</td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            ${p.payment_proof_url ? `<a href="${esc(p.payment_proof_url)}" target="_blank" class="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="View Payment Proof"><i class="fas fa-receipt text-xs"></i></a>` : ''}
            ${actionBtn}
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ==========================================================
   VERIFY PAYMENT MODAL + LOGIC
   ========================================================== */
function openVerifyModal(title, subtitle, message, btnText, onConfirm) {
  verifyState = { onConfirm };

  document.getElementById('verify-modal-title').textContent = title;
  document.getElementById('verify-modal-subtitle').textContent = subtitle;
  document.getElementById('verify-modal-message').textContent = message;
  const btn = document.getElementById('confirm-verify-btn');
  btn.textContent = btnText;

  const modal = document.getElementById('verify-modal');
  const content = document.getElementById('verify-modal-content');
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });
}
window.openVerifyModal = openVerifyModal;

function closeVerifyModal() {
  const modal = document.getElementById('verify-modal');
  const content = document.getElementById('verify-modal-content');
  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
    verifyState = null;
  }, 200);
}
window.closeVerifyModal = closeVerifyModal;

async function confirmVerify() {
  if (!verifyState || !verifyState.onConfirm) return;
  const btn = document.getElementById('confirm-verify-btn');
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i> Processing...';

  try {
    await verifyState.onConfirm();
  } catch (err) {
    console.error('Verify confirm failed:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
window.confirmVerify = confirmVerify;

async function verifyPayment(paymentId, orderUuid, orderTextId, customerPhone) {
  const { data: payment, error: fetchErr } = await supabase
    .from('payments')
    .select('total_amount, advance_paid, due_amount, payment_method, status, delivery_fee, product_price')
    .eq('id', paymentId)
    .single();

  if (fetchErr || !payment) {
    showToast('Failed to fetch payment details', 'error');
    return;
  }

  const method = payment.payment_method || '';
  const hasQuotation = (payment.product_price || 0) > 0;
  const total = payment.total_amount || 0;
  const currentStatus = payment.status || 'pending';

  let newPaymentStatus = currentStatus;
  let newAdvance = payment.advance_paid || 0;
  let newDue = payment.due_amount || 0;
  let newOrderStatus = '';
  let trackingNote = '';
  let whatsappMsg = '';
  let toastMsg = '';
  let modalTitle = '';
  let modalBtn = '';

  const runVerify = async () => {
    try {
      const { error: pErr } = await supabase
        .from('payments')
        .update({
          advance_paid: newAdvance,
          due_amount: newDue,
          status: newPaymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (pErr) throw pErr;

      const { error: oErr } = await supabase
        .from('orders')
        .update({ order_status: newOrderStatus, updated_at: new Date().toISOString() })
        .eq('id', orderUuid);

      if (oErr) throw oErr;

      if (newOrderStatus === 'ordered') {
        const { error: tErr } = await supabase
          .from('tracking_events')
          .insert([{
            order_id: orderUuid,
            status: 'ordered',
            location: null,
            note: trackingNote,
            created_at: new Date().toISOString()
          }]);

        if (tErr) throw tErr;
      }

      const pmtIdx = allPayments.findIndex(p => p.id === paymentId);
      if (pmtIdx >= 0) {
        allPayments[pmtIdx].status = newPaymentStatus;
        allPayments[pmtIdx].advance_paid = newAdvance;
        allPayments[pmtIdx].due_amount = newDue;
      }
      const ordIdx = allOrders.findIndex(o => o.id === orderUuid);
      if (ordIdx >= 0) {
        allOrders[ordIdx].order_status = newOrderStatus;
        if (allOrders[ordIdx]._payment) {
          allOrders[ordIdx]._payment.status = newPaymentStatus;
          allOrders[ordIdx]._payment.advance_paid = newAdvance;
          allOrders[ordIdx]._payment.due_amount = newDue;
        }
      }

      closeVerifyModal();
      showToast(toastMsg, 'success');
      if (currentOrderSubTab === 'orders') renderOrders(allOrders);
      if (currentOrderSubTab === 'payments') renderPayments(allPayments);
      if (currentOrderSubTab === 'quotations') renderQuotations(allQuotations);
      await refreshPayments();
      await refreshOrders();
      if (currentOrderSubTab === 'quotations') await refreshQuotations();

      if (customerPhone && whatsappMsg) {
        window.open('https://wa.me/975' + customerPhone + '?text=' + encodeURIComponent(whatsappMsg), '_blank');
      }
    } catch (err) {
      console.error('Verify payment failed:', err);
      showToast('Failed to verify: ' + err.message, 'error');
    }
  };

  if (method === 'Cash on Delivery') {
    newPaymentStatus = 'verified';
    newAdvance = total;
    newDue = 0;
    newOrderStatus = 'ordered';
    trackingNote = 'COD order confirmed. Ready for shipment.';
    toastMsg = 'COD order confirmed. Ready for shipment.';
    modalTitle = 'Confirm Cash on Delivery';
    modalBtn = 'Confirm COD';
    whatsappMsg = `Hello,\n\nYour COD order *${orderTextId}* is confirmed ✅.\nTotal: ₹${Math.round(total).toLocaleString('en-IN')}\n\nYour order will be shipped soon. Track here:\nhttps://shop2bt.vercel.app/track.html\n\n— Shop2Bhutan`;

  } else if (method === 'Full Payment') {
    if (!hasQuotation) {
      showToast('Cannot verify: Awaiting quotation from admin', 'error');
      return;
    }
    newPaymentStatus = 'verified';
    newAdvance = total;
    newDue = 0;
    newOrderStatus = 'ordered';
    trackingNote = 'Full payment verified. Order placed with seller.';
    toastMsg = 'Full payment verified. Order processing.';
    modalTitle = 'Verify Full Payment';
    modalBtn = 'Verify Full';
    whatsappMsg = `Hello,\n\nYour full payment for Order *${orderTextId}* has been verified ✅.\n\nTotal Paid: ₹${Math.round(total).toLocaleString('en-IN')}\n\nYour order has been placed with the seller. Track live progress here:\nhttps://shop2bt.vercel.app/track.html\n\n— Shop2Bhutan`;

  } else if (currentStatus === 'pending') {
    newAdvance = Math.round(total * 0.5);
    newDue = total - newAdvance;
    newPaymentStatus = 'partial';
    newOrderStatus = 'confirmed';
    trackingNote = `50% advance payment verified (₹${newAdvance.toLocaleString('en-IN')}). Balance ₹${newDue.toLocaleString('en-IN')} due before delivery.`;
    toastMsg = `50% advance verified (₹${newAdvance.toLocaleString('en-IN')}).`;
    modalTitle = 'Verify 50% Advance';
    modalBtn = 'Verify 50%';
    whatsappMsg = `Hello,\n\nYour advance payment (50%) for Order *${orderTextId}* has been verified ✅.\n\nAmount Received: ₹${newAdvance.toLocaleString('en-IN')}\nBalance Due: ₹${newDue.toLocaleString('en-IN')}\n\nPlease pay the balance before delivery. Track here:\nhttps://shop2bt.vercel.app/track.html\n\n— Shop2Bhutan`;

  } else if (currentStatus === 'partial') {
    newAdvance = total;
    newDue = 0;
    newPaymentStatus = 'verified';
    newOrderStatus = 'ordered';
    trackingNote = 'Full payment verified. Order placed with seller.';
    toastMsg = 'Full payment verified. Order processing.';
    modalTitle = 'Verify Full Payment';
    modalBtn = 'Verify Full';
    whatsappMsg = `Hello,\n\nYour full payment for Order *${orderTextId}* has been verified ✅.\n\nTotal Paid: ₹${Math.round(total).toLocaleString('en-IN')}\n\nYour order has been placed with the seller. Track live progress here:\nhttps://shop2bt.vercel.app/track.html\n\n— Shop2Bhutan`;

  } else {
    showToast('Payment already fully verified', 'info');
    return;
  }

  const modalMessage = `${modalTitle}\n\nOrder: ${orderTextId || orderUuid.slice(0, 8)}\nTotal: ₹${Math.round(total).toLocaleString('en-IN')}${newDue > 0 ? `\nAdvance: ₹${Math.round(newAdvance).toLocaleString('en-IN')}\nBalance Due: ₹${Math.round(newDue).toLocaleString('en-IN')}` : ''}\n\nOrder status will be updated to "${newOrderStatus.replace(/_/g, ' ')}".`;

  openVerifyModal(modalTitle, `Order: ${orderTextId || orderUuid.slice(0, 8)}`, modalMessage, modalBtn, runVerify);
}
window.verifyPayment = verifyPayment;

function viewOrderDetails(orderId) {
  const row = document.getElementById('order-details-' + orderId);
  if (!row) return;
  const isHidden = row.classList.contains('hidden');
  document.querySelectorAll('[id^="order-details-"]').forEach(r => r.classList.add('hidden'));
  if (isHidden) {
    row.classList.remove('hidden');
  }
}
window.viewOrderDetails = viewOrderDetails;

/* ==========================================================
   UTILITIES
   ========================================================== */
function esc(text) {
  if (!text) return '';
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function safeParseArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [val];
    } catch (e) {
      return [val];
    }
  }
  return [String(val)];
}

function canUpdateTracking(order) {
  const payment = order._payment || {};
  return payment.status === 'partial' || payment.status === 'verified';
}

/* ==========================================================
   PORTAL TAB
   ========================================================== */
function switchPortalSubTab(tab) {
  currentPortalSubTab = tab;
  ['otp', 'users'].forEach(t => {
    const btn = document.getElementById(`portal-subtab-${t}`);
    const panel = document.getElementById(`portal-panel-${t}`);
    if (!btn || !panel) return;
    if (t === tab) {
      btn.classList.add('subtab-active', 'border-indigo-600', 'text-indigo-700');
      btn.classList.remove('border-transparent', 'text-gray-500');
      panel.classList.remove('hidden');
    } else {
      btn.classList.remove('subtab-active', 'border-indigo-600', 'text-indigo-700');
      btn.classList.add('border-transparent', 'text-gray-500');
      panel.classList.add('hidden');
    }
  });
  if (tab === 'otp' && !otpCodesLoaded) loadOtpCodes();
  if (tab === 'users' && !portalUsersLoaded) loadPortalUsers();
}
window.switchPortalSubTab = switchPortalSubTab;

async function loadPortal() {
  portalLoaded = true;
  switchPortalSubTab('otp');
}

async function loadOtpCodes() {
  const loader = document.getElementById('otp-loader');
  const empty = document.getElementById('otp-empty');
  const wrap = document.getElementById('otp-table-wrap');
  const tbody = document.getElementById('otp-tbody');
  if (!tbody) return;

  loader?.classList.remove('hidden');
  empty?.classList.add('hidden');
  wrap?.classList.add('hidden');

  try {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    allOtpCodes = data || [];
    otpCodesLoaded = true;
    loader?.classList.add('hidden');

    if (allOtpCodes.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }

    renderOtpCodes(allOtpCodes);
    wrap?.classList.remove('hidden');
  } catch (err) {
    console.error('Load OTP failed:', err);
    loader?.classList.add('hidden');
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-red-500 text-sm">${err.message || 'Failed to load OTP codes'}</td></tr>`;
    wrap?.classList.remove('hidden');
    showToast('Failed to load OTP codes', 'error');
  }
}
window.loadOtpCodes = loadOtpCodes;

async function refreshOtpCodes() {
  otpCodesLoaded = false;
  await loadOtpCodes();
}
window.refreshOtpCodes = refreshOtpCodes;

function renderOtpCodes(codes) {
  const tbody = document.getElementById('otp-tbody');
  if (!tbody) return;

  tbody.innerHTML = codes.map(c => {
    const phone = c.phone || '—';
    const code = c.code || '—';
    const isUsed = c.used;
    const isExpired = new Date(c.expires_at) < new Date();
    const isActive = !isUsed && !isExpired;

    let statusBadge = '';
    if (isUsed) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-500 border-gray-200"><span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Used</span>`;
    } else if (isExpired) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-red-50 text-red-600 border-red-100"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Expired</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-100"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span>`;
    }

    const expires = c.expires_at ? new Date(c.expires_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const created = c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    return `
      <tr class="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
        <td class="px-6 py-4 font-mono text-sm text-gray-900">${esc(phone)}</td>
        <td class="px-6 py-4"><code class="text-sm font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold tracking-wider">${esc(code)}</code></td>
        <td class="px-6 py-4">${statusBadge}</td>
        <td class="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">${esc(expires)}</td>
        <td class="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">${esc(created)}</td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            ${isActive ? `<button onclick="window.copyOtpCode('${esc(code)}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100" title="Copy code"><i class="fas fa-copy"></i> Copy</button>` : ''}
            <button onclick="window.openWaFromOtp('${esc(phone)}', '${esc(code)}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Message on WhatsApp"><i class="fab fa-whatsapp"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function copyOtpCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast('Code copied: ' + code, 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Code copied: ' + code, 'success');
  });
}
window.copyOtpCode = copyOtpCode;

function openWaFromOtp(phone, code) {
  const msg = `Hello,\n\nYour Shop2Bhutan portal login code is: *${code}*\n\nEnter this code at https://shop2bt.vercel.app/portal.html to view your orders.\n\nThis code expires in 10 minutes.\n\n— Shop2Bhutan`;
  window.open('https://wa.me/' + phone.replace('+', '') + '?text=' + encodeURIComponent(msg), '_blank');
}
window.openWaFromOtp = openWaFromOtp;

async function generateAdminOtp() {
  const raw = document.getElementById('otp-gen-phone')?.value.trim().replace(/\D/g, '');
  if (!raw || raw.length < 8) {
    showToast('Enter a valid 8-digit Bhutan number', 'error');
    return;
  }
  const phone = '+975' + raw;
  const btn = document.getElementById('btn-gen-otp');

  btn.disabled = true;
  const original = btn.innerHTML;
  btn.innerHTML = '<span class="loader"></span>';

  try {
    const { data: code, error } = await supabase.rpc('request_otp', { p_phone: phone });
    if (error) throw error;

    showToast('OTP generated: ' + code, 'success');
    document.getElementById('otp-gen-phone').value = '';
    refreshOtpCodes();
    openWaFromOtp(phone, code);
  } catch (err) {
    console.error(err);
    showToast('Failed to generate OTP', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}
window.generateAdminOtp = generateAdminOtp;

/* ==========================================================
   PORTAL USERS
   ========================================================== */
async function loadPortalUsers() {
  const loader = document.getElementById('users-loader');
  const empty = document.getElementById('users-empty');
  const wrap = document.getElementById('users-table-wrap');
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  loader?.classList.remove('hidden');
  empty?.classList.add('hidden');
  wrap?.classList.add('hidden');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, whatsapp, email, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allPortalUsers = data || [];
    portalUsersLoaded = true;
    loader?.classList.add('hidden');

    if (allPortalUsers.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }

    const userIds = allPortalUsers.map(u => u.id);
    const { data: orderCounts } = await supabase
      .from('orders')
      .select('user_id', { count: 'exact' })
      .in('user_id', userIds);

    renderPortalUsers(allPortalUsers, orderCounts || []);
    wrap?.classList.remove('hidden');
  } catch (err) {
    console.error('Load users failed:', err);
    loader?.classList.add('hidden');
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-red-500 text-sm">${err.message || 'Failed to load customers'}</td></tr>`;
    wrap?.classList.remove('hidden');
    showToast('Failed to load customers', 'error');
  }
}
window.loadPortalUsers = loadPortalUsers;

async function refreshPortalUsers() {
  portalUsersLoaded = false;
  await loadPortalUsers();
}
window.refreshPortalUsers = refreshPortalUsers;

function renderPortalUsers(users, orderCounts) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  tbody.innerHTML = users.map(u => {
    const name = u.full_name || '—';
    const phone = u.whatsapp || '—';
    const email = u.email || '—';
    const joined = u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const count = orderCounts.filter(o => o.user_id === u.id).length;

    return `
      <tr class="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">
              ${name.charAt(0).toUpperCase()}
            </div>
            <div class="font-semibold text-gray-900 text-sm">${esc(name)}</div>
          </div>
        </td>
        <td class="px-6 py-4 font-mono text-sm text-gray-700">+975 ${esc(phone)}</td>
        <td class="px-6 py-4 text-sm text-gray-700">${esc(email)}</td>
        <td class="px-6 py-4 text-sm text-gray-700"><span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">${count} order${count !== 1 ? 's' : ''}</span></td>
        <td class="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">${esc(joined)}</td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button onclick="window.viewUserOrders('${u.id}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="View Orders"><i class="fas fa-box text-xs"></i></button>
            <button onclick="window.openWaUser('${esc(phone)}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Message on WhatsApp"><i class="fab fa-whatsapp"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function viewUserOrders(userId) {
  switchTab(1);
  switchOrderSubTab('orders');
  const filtered = allOrders.filter(o => o.user_id === userId);
  renderOrders(filtered);
  showToast('Showing orders for selected customer', 'info');
}
window.viewUserOrders = viewUserOrders;

function openWaUser(phone) {
  if (!phone || phone === '—') return;
  window.open('https://wa.me/975' + phone, '_blank');
}
window.openWaUser = openWaUser;

/* ==========================================================
   TRACKING MODAL
   ========================================================== */
function openTrackingModal(orderUuid, orderTextId) {
  const order = allOrders.find(o => o.id === orderUuid);
  if (!order) return;

  document.getElementById('tracking-order-id').value = orderUuid;
  document.getElementById('tracking-order-text-id').value = orderTextId || '';
  document.getElementById('tracking-modal-subtitle').textContent = `Order: ${orderTextId || orderUuid.slice(0, 8)}`;

  document.getElementById('tracking-status').value = order.order_status || 'pending';
  document.getElementById('tracking-location').value = '';
  document.getElementById('tracking-note').value = '';

  const modal = document.getElementById('tracking-modal');
  const content = document.getElementById('tracking-modal-content');
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });
}
window.openTrackingModal = openTrackingModal;

function closeTrackingModal() {
  const modal = document.getElementById('tracking-modal');
  const content = document.getElementById('tracking-modal-content');
  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  setTimeout(() => modal.classList.add('hidden'), 200);
}
window.closeTrackingModal = closeTrackingModal;

async function saveTracking() {
  const orderUuid = document.getElementById('tracking-order-id').value;
  const status = document.getElementById('tracking-status').value;
  const location = document.getElementById('tracking-location').value.trim();
  const note = document.getElementById('tracking-note').value.trim();

  if (!status) {
    showToast('Please select a status', 'error');
    return;
  }

  const btn = document.getElementById('save-tracking-btn');
  if (!btn || btn.disabled) return;

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Updating...';

  const modalContent = document.getElementById('tracking-modal-content');
  if (modalContent) modalContent.style.pointerEvents = 'none';

  try {
    const { error: trackError } = await supabase.from('tracking_events').insert([{
      order_id: orderUuid,
      status: status,
      location: location || null,
      note: note || null,
      created_at: new Date().toISOString()
    }]);
    if (trackError) throw trackError;

    const { error: orderError } = await supabase.from('orders').update({
      order_status: status,
      updated_at: new Date().toISOString()
    }).eq('id', orderUuid);
    if (orderError) throw orderError;

    closeTrackingModal();
    showToast('Tracking updated successfully', 'success');

    const trackOrdIdx = allOrders.findIndex(o => o.id === orderUuid);
    if (trackOrdIdx >= 0) {
      allOrders[trackOrdIdx].order_status = status;
    }
    if (currentOrderSubTab === 'orders') {
      renderOrders(allOrders);
      const wrap = document.getElementById('orders-table-wrap');
      if (wrap) wrap.classList.remove('hidden');
    }
    if (currentOrderSubTab === 'quotations') renderQuotations(allQuotations);
    if (currentOrderSubTab === 'payments') renderPayments(allPayments);

    try {
      await refreshOrders();
    } catch (refreshErr) {
      console.warn('Background refresh orders failed:', refreshErr);
    }
    try {
      if (currentOrderSubTab === 'quotations') await refreshQuotations();
    } catch (e) {}
    try {
      if (currentOrderSubTab === 'payments') await refreshPayments();
    } catch (e) {}

  } catch (err) {
    console.error('Save tracking failed:', err);
    showToast('Failed to update tracking: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
    if (modalContent) modalContent.style.pointerEvents = '';
  }
}
window.saveTracking = saveTracking;

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const cfg = {
    success: { bg: 'bg-emerald-600', icon: 'fa-check-circle' },
    error: { bg: 'bg-red-600', icon: 'fa-exclamation-circle' },
    info: { bg: 'bg-gray-800', icon: 'fa-info-circle' }
  };
  const { bg, icon } = cfg[type] || cfg.info;
  const toast = document.createElement('div');
  toast.className = `${bg} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium pointer-events-auto transform translate-y-4 opacity-0 transition-all duration-300 min-w-[280px]`;
  toast.innerHTML = `<i class="fas ${icon} text-white/90"></i><span class="flex-1">${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.remove('translate-y-4', 'opacity-0'));
  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================
   EVENT WIRING
   ========================================================== */
document.getElementById('confirm-delete-btn')?.addEventListener('click', confirmDelete);
document.getElementById('delete-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeAllModals();
});
document.getElementById('quote-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeQuoteModal();
});
document.getElementById('tracking-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeTrackingModal();
});
document.getElementById('verify-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeVerifyModal();
});

/* ==========================================================
   NOTIFICATION SYSTEM
   ========================================================== */
let notifications = [];
let notifRealtimeChannels = [];
let notifSoundEnabled = false;
const NOTIF_MAX_AGE_HOURS = 48;

function initNotifications() {
  loadNotifications();
  setupNotificationRealtime();
  setupNotificationUI();
}

function loadNotifications() {
  try {
    const raw = localStorage.getItem('s2b_admin_notifications');
    if (raw) {
      notifications = JSON.parse(raw).filter(n => {
        const age = (Date.now() - new Date(n.created_at).getTime()) / 36e5;
        return age < NOTIF_MAX_AGE_HOURS;
      });
    }
  } catch (e) { notifications = []; }
  updateNotifBadge();
}

function saveNotifications() {
  localStorage.setItem('s2b_admin_notifications', JSON.stringify(notifications.slice(0, 50)));
}

function setupNotificationRealtime() {
  const ordersChannel = supabase
    .channel('notif-orders')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
      const order = payload.new;
      addNotification({
        type: 'order',
        title: 'New Order Received',
        message: `Order ${(order.order_id || '').slice(0, 12)} from ${order.delivery_city || 'Unknown'}`,
        data: { order_id: order.id, tab: 1 },
        icon: 'fa-shopping-bag'
      });
    })
    .subscribe();

  const reviewsChannel = supabase
    .channel('notif-reviews')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, (payload) => {
      const review = payload.new;
      addNotification({
        type: 'review',
        title: 'New Review Submitted',
        message: `${review.full_name || 'Someone'} rated ${review.rating || 0}★ — "${(review.message || '').slice(0, 40)}${(review.message || '').length > 40 ? '...' : ''}"`,
        data: { review_id: review.id, tab: 0 },
        icon: 'fa-star'
      });
    })
    .subscribe();

  const paymentsChannel = supabase
    .channel('notif-payments')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, (payload) => {
      const pay = payload.new;
      addNotification({
        type: 'payment',
        title: 'Payment Received',
        message: `₹${Math.round(pay.total_amount || 0).toLocaleString('en-IN')} via ${pay.payment_method || '—'}`,
        data: { payment_id: pay.id, tab: 1, subtab: 'payments' },
        icon: 'fa-money-bill-wave'
      });
    })
    .subscribe();

  const payUpdateChannel = supabase
    .channel('notif-payments-updates')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments' }, (payload) => {
      const pay = payload.new;
      const old = payload.old;
      if (old.status === 'pending' && pay.status === 'partial') {
        addNotification({
          type: 'payment',
          title: '50% Advance Verified',
          message: `Order payment partially confirmed. ₹${Math.round(pay.due_amount || 0).toLocaleString('en-IN')} still due.`,
          data: { payment_id: pay.id, tab: 1, subtab: 'payments' },
          icon: 'fa-check-circle'
        });
      }
      if (old.status === 'partial' && pay.status === 'verified') {
        addNotification({
          type: 'payment',
          title: 'Full Payment Verified',
          message: `Order fully paid. Ready to process.`,
          data: { payment_id: pay.id, tab: 1, subtab: 'payments' },
          icon: 'fa-check-double'
        });
      }
    })
    .subscribe();

  const usersChannel = supabase
    .channel('notif-users')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
      const user = payload.new;
      addNotification({
        type: 'user',
        title: 'New Customer Registered',
        message: `${user.full_name || 'New user'} (+975 ${user.whatsapp || '—'})`,
        data: { user_id: user.id, tab: 3, subtab: 'users' },
        icon: 'fa-user-plus'
      });
    })
    .subscribe();

  const quotesChannel = supabase
    .channel('notif-quotes')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quotations' }, (payload) => {
      const q = payload.new;
      const old = payload.old;
      if (old.status === 'pending' && q.status === 'accepted') {
        addNotification({
          type: 'quotation',
          title: 'Quotation Accepted',
          message: `Customer accepted quote. Total: ₹${Math.round(q.total_amount || 0).toLocaleString('en-IN')}`,
          data: { quotation_id: q.id, tab: 1, subtab: 'quotations' },
          icon: 'fa-file-signature'
        });
      }
      if (old.status === 'pending' && q.status === 'rejected') {
        addNotification({
          type: 'quotation',
          title: 'Quotation Rejected',
          message: `Customer rejected the quotation.`,
          data: { quotation_id: q.id, tab: 1, subtab: 'quotations' },
          icon: 'fa-times-circle'
        });
      }
    })
    .subscribe();

  notifRealtimeChannels = [ordersChannel, reviewsChannel, paymentsChannel, payUpdateChannel, usersChannel, quotesChannel];
}

function addNotification({ type, title, message, data = {}, icon = 'fa-bell' }) {
  const notif = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    type,
    title,
    message,
    data,
    icon,
    is_read: false,
    created_at: new Date().toISOString()
  };

  const recent = notifications.find(n => n.type === type && n.message === message && (Date.now() - new Date(n.created_at).getTime()) < 5000);
  if (recent) return;

  notifications.unshift(notif);
  if (notifications.length > 50) notifications.pop();
  saveNotifications();

  updateNotifBadge();
  renderNotificationList();
  playNotifSound();

  const toastType = type === 'payment' ? 'success' : type === 'order' ? 'info' : 'info';
  showToast(title, toastType);
}

function updateNotifBadge() {
  const unread = notifications.filter(n => !n.is_read).length;
  const badge = document.getElementById('notif-badge');
  const toggle = document.getElementById('notif-toggle');
  const subtitle = document.getElementById('notif-subtitle');

  if (!badge) return;

  if (unread > 0) {
    badge.textContent = unread > 99 ? '99+' : unread;
    badge.classList.remove('hidden');
    badge.classList.add('pulse');
    toggle?.classList.add('has-new');
    if (subtitle) subtitle.textContent = `${unread} unread notification${unread !== 1 ? 's' : ''}`;
    setTimeout(() => badge.classList.remove('pulse'), 600);
  } else {
    badge.classList.add('hidden');
    toggle?.classList.remove('has-new');
    if (subtitle) subtitle.textContent = 'No new alerts';
  }
}

function renderNotificationList() {
  const list = document.getElementById('notif-list');
  if (!list) return;

  if (notifications.length === 0) {
    list.innerHTML = `
      <div class="empty-notif">
        <i class="fas fa-bell-slash text-gray-300"></i>
        <p class="text-sm text-gray-500">You're all caught up</p>
      </div>`;
    return;
  }

  list.innerHTML = notifications.map(n => {
    const timeAgo = getTimeAgo(n.created_at);
    const unreadClass = n.is_read ? 'read' : 'unread';
    const iconMap = {
      order: 'fa-shopping-bag',
      review: 'fa-star',
      payment: 'fa-money-bill-wave',
      user: 'fa-user-plus',
      quotation: 'fa-file-signature',
      tracking: 'fa-truck-fast'
    };
    const icon = iconMap[n.type] || n.icon || 'fa-bell';

    return `
      <div class="notif-item ${unreadClass}" onclick="window.handleNotifClick('${n.id}')" data-id="${n.id}">
        <div class="notif-icon ${n.type}"><i class="fas ${icon}"></i></div>
        <div class="notif-content">
          <div class="notif-title">${esc(n.title)}</div>
          <div class="notif-message">${esc(n.message)}</div>
          <div class="notif-time"><i class="far fa-clock mr-1"></i>${timeAgo}</div>
        </div>
        <div class="notif-read-dot"></div>
      </div>`;
  }).join('');
}

function getTimeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function setupNotificationUI() {
  const toggle = document.getElementById('notif-toggle');
  const dropdown = document.getElementById('notif-dropdown');
  const markAll = document.getElementById('notif-mark-all');
  const soundBtn = document.getElementById('notif-sound-toggle');

  toggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
      dropdown.classList.remove('hidden');
      renderNotificationList();
    } else {
      dropdown.classList.add('hidden');
    }
  });

  document.addEventListener('click', (e) => {
    if (!dropdown?.contains(e.target) && e.target !== toggle && !toggle?.contains(e.target)) {
      dropdown?.classList.add('hidden');
    }
  });

  markAll?.addEventListener('click', (e) => {
    e.stopPropagation();
    notifications.forEach(n => n.is_read = true);
    saveNotifications();
    updateNotifBadge();
    renderNotificationList();
    showToast('All notifications marked as read', 'success');
  });

  soundBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    notifSoundEnabled = !notifSoundEnabled;
    const icon = soundBtn.querySelector('i');
    icon.className = notifSoundEnabled ? 'fas fa-volume-up text-xs' : 'fas fa-volume-mute text-xs';
    soundBtn.classList.toggle('text-indigo-600', notifSoundEnabled);
    showToast(notifSoundEnabled ? 'Notification sound enabled' : 'Notification sound muted', 'info');
  });
}

function handleNotifClick(id) {
  const notif = notifications.find(n => n.id === id);
  if (!notif) return;

  notif.is_read = true;
  saveNotifications();
  updateNotifBadge();
  renderNotificationList();

  if (notif.data?.tab !== undefined) {
    switchTab(notif.data.tab);
    if (notif.data.subtab) {
      if (notif.data.tab === 1) switchOrderSubTab(notif.data.subtab);
      if (notif.data.tab === 3) switchPortalSubTab(notif.data.subtab);
    }
  }

  document.getElementById('notif-dropdown')?.classList.add('hidden');
}
window.handleNotifClick = handleNotifClick;

function playNotifSound() {
  if (!notifSoundEnabled) return;
  const audio = document.getElementById('notif-sound');
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

function notifyNewOrder(order) {
  addNotification({
    type: 'order',
    title: 'New Order',
    message: `Order #${(order.order_id || '').slice(0, 12)} — ${order.delivery_city || 'Unknown'}`,
    data: { tab: 1 },
    icon: 'fa-shopping-bag'
  });
}
window.notifyNewOrder = notifyNewOrder;

function notifyPaymentVerified(amount, method) {
  addNotification({
    type: 'payment',
    title: 'Payment Verified',
    message: `₹${Math.round(amount).toLocaleString('en-IN')} via ${method || '—'}`,
    data: { tab: 1, subtab: 'payments' },
    icon: 'fa-check-circle'
  });
}
window.notifyPaymentVerified = notifyPaymentVerified;

/* ==========================================================
   START
   ========================================================== */
init();