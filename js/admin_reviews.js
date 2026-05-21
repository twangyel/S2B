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
let currentOrderSubTab = 'orders';
let authChecked = false;

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

  } catch (err) {
    console.error('Init error:', err);
    if (!authChecked) window.location.replace('/admin-login.html');
  }
}

/* ==========================================================
   TAB VISUALS
   ========================================================== */
function updateTabVisuals(index) {
  [0, 1, 2].forEach(i => {
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

function refreshReviews() {
  reviewsLoaded = false;
  loadReviews();
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
    refreshReviews();
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
    refreshReviews();
  } catch (err) {
    console.error('Delete failed:', err);
    showToast('Failed to delete review', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Delete'; }
    deleteTargetId = null;
  }
}

/* ==========================================================
   ORDERS & QUOTATIONS
   ========================================================== */
function switchOrderSubTab(tab) {
  currentOrderSubTab = tab;
  ['orders', 'quotations'].forEach(t => {
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
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_id, user_id, delivery_city, delivery_address, product_links, quantities, screenshot_url, order_status, total_amount, payment_method, created_at, users(full_name, whatsapp, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allOrders = data || [];
    ordersLoaded = true;
    loader?.classList.add('hidden');

    if (allOrders.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }

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

function refreshOrders() {
  ordersLoaded = false;
  loadOrders();
}
window.refreshOrders = refreshOrders;

function renderOrders(orders) {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = orders.map(o => {
    const user = o.users || {};
    const name = user.full_name || '—';
    const phone = user.whatsapp || '—';
    const city = o.delivery_city || '—';
    const productCount = (o.product_links || []).length;
    const status = o.order_status || 'pending';
    const hasQuote = allQuotations.some(q => q.order_id === o.id);

    const statusColors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      quoted: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
      ordered: 'bg-sky-50 text-sky-700 border-sky-100',
      shipped: 'bg-purple-50 text-purple-700 border-purple-100',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      cancelled: 'bg-red-50 text-red-700 border-red-100'
    };

    return `
      <tr class="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
        <td class="px-6 py-4"><code class="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded font-semibold">${esc(o.order_id || '—')}</code></td>
        <td class="px-6 py-4"><div class="font-semibold text-gray-900 text-sm">${esc(name)}</div><div class="text-xs text-gray-400 mt-0.5">+975 ${esc(phone)}</div></td>
        <td class="px-6 py-4 text-sm text-gray-700">${esc(city)}</td>
        <td class="px-6 py-4 text-sm text-gray-700"><span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium"><i class="fas fa-box text-[10px]"></i> ${productCount} item${productCount !== 1 ? 's' : ''}</span></td>
        <td class="px-6 py-4 text-sm text-gray-700"><span class="text-xs text-gray-500">${esc(o.payment_method || '—')}</span></td>
        <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors.pending}"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button onclick="window.openQuoteModal('${o.id}', '${esc(o.order_id || '')}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${hasQuote ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100' : 'text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600'}" title="${hasQuote ? 'Edit Quotation' : 'Create Quotation'}"><i class="fas ${hasQuote ? 'fa-pen' : 'fa-plus'}"></i> ${hasQuote ? 'Edit Quote' : 'Quote'}</button>
            <button onclick="window.viewOrderDetails('${o.id}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors" title="View Details"><i class="fas fa-eye text-xs"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
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
  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  setTimeout(() => modal.classList.add('hidden'), 200);
}
window.closeQuoteModal = closeQuoteModal;

// Auto-calculate service fee and total
['quote-product-price', 'quote-shipping', 'quote-delivery'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    autoCalculateServiceFee();
    updateQuoteTotal();
  });
});

// Service fee can also be manually overridden
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
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Saving...';

  try {
    const { data: existing } = await supabase.from('quotations').select('id').eq('order_id', orderUuid).maybeSingle();

    const payload = {
      order_id: orderUuid,
      product_price: Math.round(productPrice),
      shipping_fee: Math.round(shipping),
      service_fee: Math.round(service),
      delivery_fee: Math.round(delivery),
      total_amount: total,  // ← now works as regular column
      status: 'pending',
      note: note || null,
      updated_at: new Date().toISOString()
    };

    let error;
    if (existing) {
      ({ error } = await supabase.from('quotations').update(payload).eq('id', existing.id));
    } else {
      payload.created_at = new Date().toISOString();
      ({ error } = await supabase.from('quotations').insert([payload]));
    }
    if (error) throw error;

    await supabase.from('orders').update({ order_status: 'quoted' }).eq('id', orderUuid);

    const orderTextId = document.getElementById('quote-order-text-id').value;
    await supabase.from('payments').update({
      product_price: Math.round(productPrice),
      shipping_fee: Math.round(shipping),
      service_fee: Math.round(service),
      delivery_fee: Math.round(delivery),
      total_amount: total,
      updated_at: new Date().toISOString()
    }).eq('order_id', orderTextId);

    closeQuoteModal();
    showToast('Quotation saved successfully', 'success');
    refreshOrders();
    refreshQuotations();
  } catch (err) {
    console.error('Save quotation failed:', err);
    showToast('Failed to save quotation: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
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
      .select('*, orders!inner(id, order_id, users(full_name))')
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

function refreshQuotations() {
  quotationsLoaded = false;
  loadQuotations();
}
window.refreshQuotations = refreshQuotations;

function renderQuotations(quotes) {
  const tbody = document.getElementById('quotations-tbody');
  if (!tbody) return;

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
        <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors.pending}"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
        <td class="px-6 py-4 text-gray-500 text-xs font-medium whitespace-nowrap">${date}</td>
        <td class="px-6 py-4 text-right"><button onclick="window.openQuoteModal('${q.order_id}', '${esc(order.order_id || '')}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors ml-auto" title="Edit Quotation"><i class="fas fa-pen text-xs"></i></button></td>
      </tr>`;
  }).join('');
}

function viewOrderDetails(orderId) {
  showToast('Order detail view coming soon. ID: ' + orderId.slice(0, 8), 'info');
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

/* ==========================================================
   START
   ========================================================== */
init();