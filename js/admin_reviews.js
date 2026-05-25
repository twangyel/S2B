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
let authChecked = false;
<<<<<<< HEAD
let currentOrderSubTab = 'orders';
=======
>>>>>>> 1c5cd4d (Update all files and folders)
let allTrips = [];
let tripsLoaded = false;
let allMessageLogs = [];
let messagesLoaded = false;
let tripSelectedOrders = new Set();
<<<<<<< HEAD

const WA_TEMPLATES = [
  { id: 'custom', name: 'Custom Message', message: '' },
  { id: 'otp', name: 'Send OTP', message: 'Hello,\n\nYour Shop2Bhutan portal login code is: *{code}*\n\nEnter this code at https://shop2bt.vercel.app/portal.html to view your orders.\n\nThis code expires in 10 minutes.\n\n— Shop2Bhutan' },
  { id: 'quote_ready', name: 'Quotation Ready', message: 'Hello,\n\nYour quotation for Order *{order_id}* is ready.\n\nTotal: ₹{total}\n\nPlease accept and proceed with payment via the portal:\nhttps://shop2bt.vercel.app/portal.html\n\n— Shop2Bhutan' },
  { id: 'advance_reminder', name: 'Advance Reminder', message: 'Hello,\n\nReminder: 50% advance payment of ₹{amount} is due for Order *{order_id}*.\n\nPlease upload payment proof via the portal.\n\n— Shop2Bhutan' },
  { id: 'balance_reminder', name: 'Balance Due Reminder', message: 'Hello,\n\nYour order *{order_id}* is out for delivery. Balance due: ₹{amount}.\n\nPlease keep the exact amount ready.\n\n— Shop2Bhutan' },
  { id: 'tracking_update', name: 'Tracking Update', message: 'Hello,\n\nYour order *{order_id}* status has been updated to: *{status}*.\n\nTrack live progress here:\nhttps://shop2bt.vercel.app/track.html\n\n— Shop2Bhutan' },
  { id: 'delivered', name: 'Delivered + Review Request', message: 'Hello,\n\nYour order *{order_id}* has been delivered ✅.\n\nWe hope you love it! Please leave a review:\nhttps://shop2bt.vercel.app/\n\n— Shop2Bhutan' }
];


=======
>>>>>>> 1c5cd4d (Update all files and folders)

const WA_TEMPLATES = [
  { id: 'custom', name: 'Custom Message', message: '' },
  { id: 'otp', name: 'Send OTP', message: 'Hello,\n\nYour Shop2Bhutan portal login code is: *{code}*\n\nEnter this code at https://shop2bt.vercel.app/portal.html to view your orders.\n\nThis code expires in 10 minutes.\n\n— Shop2Bhutan' },
  { id: 'quote_ready', name: 'Quotation Ready', message: 'Hello,\n\nYour quotation for Order *{order_id}* is ready.\n\nTotal: ₹{total}\n\nPlease accept and proceed with payment via the portal:\nhttps://shop2bt.vercel.app/portal.html\n\n— Shop2Bhutan' },
  { id: 'advance_reminder', name: 'Advance Reminder', message: 'Hello,\n\nReminder: 50% advance payment of ₹{amount} is due for Order *{order_id}*.\n\nPlease upload payment proof via the portal.\n\n— Shop2Bhutan' },
  { id: 'balance_reminder', name: 'Balance Due Reminder', message: 'Hello,\n\nYour order *{order_id}* is out for delivery. Balance due: ₹{amount}.\n\nPlease keep the exact amount ready.\n\n— Shop2Bhutan' },
  { id: 'tracking_update', name: 'Tracking Update', message: 'Hello,\n\nYour order *{order_id}* status has been updated to: *{status}*.\n\nTrack live progress here:\nhttps://shop2bt.vercel.app/track.html\n\n— Shop2Bhutan' },
  { id: 'delivered', name: 'Delivered + Review Request', message: 'Hello,\n\nYour order *{order_id}* has been delivered ✅.\n\nWe hope you love it! Please leave a review:\nhttps://shop2bt.vercel.app/\n\n— Shop2Bhutan' }
];


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
<<<<<<< HEAD
  [0, 1, 2, 3, 4].forEach(i => {
=======
  [0, 1, 2, 3, 4].forEach(i => {   // ← added 4
>>>>>>> 1c5cd4d (Update all files and folders)
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
  if (index === 2 && !analyticsLoaded) loadAnalytics();
  if (index === 3 && !portalLoaded) loadPortal();
  if (index === 4 && !tripsLoaded) loadTrips();
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
    const _rDate = r.created_at ? new Date(/[Z+\-]\d{2}:?\d{2}$|Z$/.test(r.created_at) ? r.created_at : r.created_at + 'Z') : null;
    const date = _rDate && !isNaN(_rDate) ? _rDate.toLocaleDateString('en-US', { timeZone: 'Asia/Thimphu', month: 'short', day: 'numeric', year: 'numeric' }) : '-';

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
    tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-12 text-center text-red-500 text-sm">${err.message || 'Failed to load orders'}</td></tr>`; //cols add extra column
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
            ${esc(name)}<br>
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
        <td class="px-6 py-4 text-gray-500 text-xs font-medium whitespace-nowrap">${formatBtnDate(o.created_at)}</td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button onclick="window.openQuoteModal('${o.id}', '${esc(o.order_id || '')}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${hasQuote ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100' : 'text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600'}" title="${hasQuote ? 'Edit Quotation' : 'Create Quotation'}"><i class="fas ${hasQuote ? 'fa-pen' : 'fa-plus'}"></i> ${hasQuote ? 'Edit Quote' : 'Quote'}</button>
            ${canUpdateTracking(o)
              ? `<button onclick="window.openTrackingModal('${o.id}', '${esc(o.order_id || '')}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" title="Update Tracking"><i class="fas fa-truck-fast text-xs"></i></button>`
              : `<button disabled class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 cursor-not-allowed" title="Tracking available after payment confirmation"><i class="fas fa-truck-fast text-xs"></i></button>`
            }
            <button onclick="window.viewOrderDetails('${o.id}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors" title="View Details"><i class="fas fa-eye text-xs"></i></button>
<<<<<<< HEAD
          <button onclick="window.openTimelineModal('${o.id}', '${esc(o.order_id || '')}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" title="Activity Timeline"><i class="fas fa-stream text-xs"></i></button>
=======
            <button onclick="window.openTimelineModal('${o.id}', '${esc(o.order_id || '')}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" title="Activity Timeline"><i class="fas fa-stream text-xs"></i></button>
>>>>>>> 1c5cd4d (Update all files and folders)
${o.order_status !== 'cancelled' && o.order_status !== 'delivered' ? `<button onclick="window.openCancelModal('${o.id}', '${esc(o.order_id || '')}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Cancel Order"><i class="fas fa-ban text-xs"></i></button>` : ''}
            </div>
        </td>
      </tr>
      <tr class="hidden bg-gray-50/50" id="order-details-${o.id}">
        <td colspan="8" class="px-6 py-5 border-b border-gray-100">
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
    updateQuoteProfit();   // ← added
  });
});

document.getElementById('quote-service')?.addEventListener('input', () => {
  updateQuoteTotal();
  updateQuoteProfit();     // ← added
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

<<<<<<< HEAD
const actualProduct = parseFloat(document.getElementById('quote-actual-product')?.value) || 0;
const actualShipping = parseFloat(document.getElementById('quote-actual-shipping')?.value) || 0;
const actualCustoms = parseFloat(document.getElementById('quote-actual-customs')?.value) || 0;
=======
  const actualProduct = parseFloat(document.getElementById('quote-actual-product').value) || 0;
const actualShipping = parseFloat(document.getElementById('quote-actual-shipping').value) || 0;
const actualCustoms = parseFloat(document.getElementById('quote-actual-customs').value) || 0;
>>>>>>> 1c5cd4d (Update all files and folders)
const profit = Math.round(total - (actualProduct + actualShipping + actualCustoms));

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
      actual_product_price: Math.round(actualProduct),
actual_shipping_cost: Math.round(actualShipping),
actual_customs_cost: Math.round(actualCustoms),
profit_amount: profit,
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
   tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-12 text-center text-red-500 text-sm">...`;
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
    const date = formatBtnDate(q.created_at);

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
        <td class="px-6 py-4 text-sm font-semibold ${(q.profit_amount || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}">₹${Math.round(q.profit_amount || 0).toLocaleString('en-IN')}</td>
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
    const _pDate = p.created_at ? new Date(/[Z+\-]\d{2}:?\d{2}$|Z$/.test(p.created_at) ? p.created_at : p.created_at + 'Z') : null;
    const date = _pDate && !isNaN(_pDate) ? _pDate.toLocaleString('en-US', { timeZone: 'Asia/Thimphu', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
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
<<<<<<< HEAD
    }     else if (status === 'verified') {
      actionBtn = `<span class="text-xs text-gray-400 font-medium"><i class="fas fa-check-circle text-emerald-500 mr-1"></i>Verified</span>
      <button onclick="window.openRefundModal('${p.order_id || ''}', '${esc(order.order_id || '')}', ${Math.round(total)})" class="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-1" title="Record Refund"><i class="fas fa-undo text-xs"></i></button>`;
=======
    } else if (status === 'verified') {
      actionBtn = `<span class="text-xs text-gray-400 font-medium"><i class="fas fa-check-circle text-emerald-500 mr-1"></i>Verified</span>
  <button onclick="window.openRefundModal('${p.order_id || ''}', '${esc(order.order_id || '')}', ${Math.round(total)})" class="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-1" title="Record Refund"><i class="fas fa-undo text-xs"></i></button>`;
>>>>>>> 1c5cd4d (Update all files and folders)
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

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

function formatBtnDate(isoString) {
  if (!isoString) return '—';
  // Ensure the string is treated as UTC by appending 'Z' if no timezone info present
  const normalized = /[Z+\-]\d{2}:?\d{2}$|Z$/.test(isoString) ? isoString : isoString + 'Z';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '—';

  // Use Intl.DateTimeFormat with explicit Bhutan timezone (UTC+6, no DST)
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Thimphu',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d).replace(',', '');
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
 ['otp', 'users', 'messages'].forEach(t => {
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
  if (tab === 'messages' && !messagesLoaded) loadMessageLogs();
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

    const _expDate = c.expires_at ? new Date(/[Z+\-]\d{2}:?\d{2}$|Z$/.test(c.expires_at) ? c.expires_at : c.expires_at + 'Z') : null;
    const expires = _expDate && !isNaN(_expDate) ? _expDate.toLocaleString('en-US', { timeZone: 'Asia/Thimphu', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
    const _crDate = c.created_at ? new Date(/[Z+\-]\d{2}:?\d{2}$|Z$/.test(c.created_at) ? c.created_at : c.created_at + 'Z') : null;
    const created = _crDate && !isNaN(_crDate) ? _crDate.toLocaleString('en-US', { timeZone: 'Asia/Thimphu', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

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
            <button onclick="window.openWaFromOtp('${esc(phone)}', '${esc(code)}', event)" ...>
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

    // FIX: fetch actual rows and count client-side instead of broken count:exact
    const userIds = allPortalUsers.map(u => u.id);
    const { data: orderRows, error: orderErr } = await supabase
      .from('orders')
      .select('user_id')
      .in('user_id', userIds);

    if (orderErr) console.warn('Order count fetch warning:', orderErr);

    // Build a count map client-side
    const countMap = {};
    (orderRows || []).forEach(o => {
      countMap[o.user_id] = (countMap[o.user_id] || 0) + 1;
    });

    renderPortalUsers(allPortalUsers, countMap);
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

function renderPortalUsers(users, countMap) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  tbody.innerHTML = users.map(u => {
    const name = u.full_name || '—';
    const phone = u.whatsapp || '—';
    const email = u.email || '—';
    const _uDate = u.created_at ? new Date(/[Z+\-]\d{2}:?\d{2}$|Z$/.test(u.created_at) ? u.created_at : u.created_at + 'Z') : null;
    const joined = _uDate && !isNaN(_uDate) ? _uDate.toLocaleDateString('en-US', { timeZone: 'Asia/Thimphu', month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const count = countMap[u.id] || 0;   // ← use map lookup

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
<<<<<<< HEAD
           <button onclick="window.openCustomerModal('${u.id}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="View Profile"><i class="fas fa-user text-xs"></i></button>
            <button onclick="window.openWaUser('${esc(phone)}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Message on WhatsApp"><i class="fab fa-whatsapp"></i></button>
=======
            <button onclick="window.openCustomerModal('${u.id}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="View Profile"><i class="fas fa-user text-xs"></i></button>
            <button onclick="window.openWaUser('${esc(phone)}', event)" class="flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Message on WhatsApp"><i class="fab fa-whatsapp"></i></button>
>>>>>>> 1c5cd4d (Update all files and folders)
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

window.openWaFromOtp = function(phone, code, event) {
  const menu = document.createElement('div');
  menu.className = 'absolute z-50 bg-white rounded-lg shadow-xl border border-gray-100 py-1 w-56';
  menu.innerHTML = getTemplateMenuHtml({ phone, code });
  document.body.appendChild(menu);
  const rect = event.target.getBoundingClientRect();
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = rect.left + 'px';
  const close = () => menu.remove();
  menu.addEventListener('click', () => setTimeout(close, 50));
  setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
};

window.openWaUser = function(phone, event) {
  if (!phone || phone === '—') return;
  const clean = String(phone).replace(/\D/g, '');
  const menu = document.createElement('div');
  menu.className = 'absolute z-50 bg-white rounded-lg shadow-xl border border-gray-100 py-1 w-56';
  menu.innerHTML = getTemplateMenuHtml({ phone: clean });
  document.body.appendChild(menu);
  const rect = event.target.getBoundingClientRect();
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = rect.left + 'px';
  const close = () => menu.remove();
  menu.addEventListener('click', () => setTimeout(close, 50));
  setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
};
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
document.getElementById('customer-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeCustomerModal();
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
document.getElementById('customer-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeCustomerModal();
});

/* ==========================================================
   NOTIFICATION SYSTEM — FIXED VERSION
   ========================================================== */
let notifications = [];
let notifRealtimeChannels = [];
let notifSoundEnabled = (() => {
  try { return localStorage.getItem('s2b_notif_sound') === 'true'; }
  catch(e) { return false; }
})();
const NOTIF_MAX_AGE_HOURS = 48;

function initNotifications() {
  // FIX #2: Unsubscribe old channels before creating new ones
  notifRealtimeChannels.forEach(ch => {
    try { supabase.removeChannel(ch); } catch (e) {}
  });
  notifRealtimeChannels = [];

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
  // FIX #5: Add error handling to all subscriptions
  let _rlsWarningShown = false;
  const handleSubError = (status, err, channelName) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.error(`[Notif] Channel "${channelName}" status: ${status}`, err || '');
      console.warn('[Notif] CHANNEL_ERROR usually means Supabase RLS is blocking the anon role. Add a SELECT policy or use a service role key.');
      if (!_rlsWarningShown) {
        _rlsWarningShown = true;
        document.getElementById('rls-warning')?.classList.remove('hidden');
      }
    } else if (status === 'SUBSCRIBED') {
      console.log(`[Notif] ✅ Channel "${channelName}" subscribed`);
    }
  };

  const ordersChannel = supabase
    .channel('notif-orders')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
      const order = payload.new;
      addNotification({
        type: 'order',
        title: 'New Order Received',
        message: `Order ${(order.order_id || '').slice(0, 12)} from ${order.delivery_city || 'Unknown'}`,
        data: { order_id: order.id, tab: 1 },
        icon: 'fa-shopping-bag',
        dedupKey: order.id  // FIX #1: Unique dedup key
      });
    })
    .subscribe((status, err) => handleSubError(status, err, 'orders'));

  const reviewsChannel = supabase
    .channel('notif-reviews')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, (payload) => {
      const review = payload.new;
      addNotification({
        type: 'review',
        title: 'New Review Submitted',
        message: `${review.full_name || 'Someone'} rated ${review.rating || 0}★ — "${(review.message || '').slice(0, 40)}${(review.message || '').length > 40 ? '...' : ''}"`,
        data: { review_id: review.id, tab: 0 },
        icon: 'fa-star',
        dedupKey: review.id  // FIX #1: Unique dedup key
      });
    })
    .subscribe((status, err) => handleSubError(status, err, 'reviews'));

  const paymentsChannel = supabase
    .channel('notif-payments')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, (payload) => {
      const pay = payload.new;
      addNotification({
        type: 'payment',
        title: 'Payment Received',
        message: `₹${Math.round(pay.total_amount || 0).toLocaleString('en-IN')} via ${pay.payment_method || '—'}`,
        data: { payment_id: pay.id, tab: 1, subtab: 'payments' },
        icon: 'fa-money-bill-wave',
        dedupKey: pay.id  // FIX #1: Unique dedup key
      });
    })
    .subscribe((status, err) => handleSubError(status, err, 'payments'));

  const payUpdateChannel = supabase
    .channel('notif-payments-updates')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments' }, (payload) => {
      const pay = payload.new;
      const old = (payload.old && Object.keys(payload.old).length > 0) ? payload.old : {};
      if (old.status === 'pending' && pay.status === 'partial') {
        addNotification({
          type: 'payment',
          title: '50% Advance Verified',
          message: `Order payment partially confirmed. ₹${Math.round(pay.due_amount || 0).toLocaleString('en-IN')} still due.`,
          data: { payment_id: pay.id, tab: 1, subtab: 'payments' },
          icon: 'fa-check-circle',
          dedupKey: pay.id + '-partial'  // FIX #1: Unique dedup key for status change
        });
      }
      if (old.status === 'partial' && pay.status === 'verified') {
        addNotification({
          type: 'payment',
          title: 'Full Payment Verified',
          message: `Order fully paid. Ready to process.`,
          data: { payment_id: pay.id, tab: 1, subtab: 'payments' },
          icon: 'fa-check-double',
          dedupKey: pay.id + '-verified'
        });
      }
      // Direct pending→verified (most common flow: admin verifies uploaded proof)
      if (old.status === 'pending' && pay.status === 'verified' && pay.payment_proof_url) {
        addNotification({
          type: 'payment',
          title: 'Payment Proof Verified',
          message: `₹${Math.round(pay.total_amount || 0).toLocaleString('en-IN')} payment confirmed via ${pay.payment_method || '—'}`,
          data: { payment_id: pay.id, tab: 1, subtab: 'payments' },
          icon: 'fa-check-circle',
          dedupKey: pay.id + '-proof-verified'
        });
      }
    })
    .subscribe((status, err) => handleSubError(status, err, 'payments-updates'));

  const usersChannel = supabase
    .channel('notif-users')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
      const user = payload.new;
      addNotification({
        type: 'user',
        title: 'New Customer Registered',
        message: `${user.full_name || 'New user'} (+975 ${user.whatsapp || '—'})`,
        data: { user_id: user.id, tab: 3, subtab: 'users' },
        icon: 'fa-user-plus',
        dedupKey: user.id  // FIX #1: Unique dedup key
      });
    })
    .subscribe((status, err) => handleSubError(status, err, 'users'));

  const quotesChannel = supabase
    .channel('notif-quotes')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quotations' }, (payload) => {
      const q = payload.new;
      const old = (payload.old && Object.keys(payload.old).length > 0) ? payload.old : {};
      if (old.status === 'pending' && q.status === 'accepted') {
        addNotification({
          type: 'quotation',
          title: 'Quotation Accepted',
          message: `Customer accepted quote. Total: ₹${Math.round(q.total_amount || 0).toLocaleString('en-IN')}`,
          data: { quotation_id: q.id, tab: 1, subtab: 'quotations' },
          icon: 'fa-file-signature',
          dedupKey: q.id + '-accepted'  // FIX #1: Unique dedup key
        });
      }
      if (old.status === 'pending' && q.status === 'rejected') {
        addNotification({
          type: 'quotation',
          title: 'Quotation Rejected',
          message: `Customer rejected the quotation.`,
          data: { quotation_id: q.id, tab: 1, subtab: 'quotations' },
          icon: 'fa-times-circle',
          dedupKey: q.id + '-rejected'  // FIX #1: Unique dedup key
        });
      }
    })
    .subscribe((status, err) => handleSubError(status, err, 'quotations'));

  // FIX #3: Add tracking events channel (was missing)
  const trackingChannel = supabase
    .channel('notif-tracking')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tracking_events' }, (payload) => {
      const event = payload.new;
      addNotification({
        type: 'tracking',
        title: 'Tracking Update',
        message: `Order status updated to: ${(event.status || '').replace(/_/g, ' ')}`,
        data: { tracking_id: event.id, tab: 1, subtab: 'orders' },
        icon: 'fa-truck-fast',
        dedupKey: event.id  // FIX #1: Unique dedup key
      });
    })
    .subscribe((status, err) => handleSubError(status, err, 'tracking'));

  notifRealtimeChannels = [ordersChannel, reviewsChannel, paymentsChannel, payUpdateChannel, usersChannel, quotesChannel, trackingChannel];
}

function addNotification({ type, title, message, data = {}, icon = 'fa-bell', dedupKey = null }) {
  // FIX #1: Use dedupKey for proper deduplication (includes unique ID + status suffix)
  const effectiveKey = dedupKey || (type + '-' + message);
  const recent = notifications.find(n => 
    (n.dedupKey || (n.type + '-' + n.message)) === effectiveKey && 
    (Date.now() - new Date(n.created_at).getTime()) < 30000  // 30s dedup window
  );
  if (recent) return;

  const notif = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    dedupKey: effectiveKey,  // Store for future deduplication
    type,
    title,
    message,
    data,
    icon,
    is_read: false,
    created_at: new Date().toISOString()
  };

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

// FIX #7: Consistent timezone handling for time ago
function getTimeAgo(iso) {
  const normalized = /[Z+\-]\d{2}:?\d{2}$|Z$/.test(iso) ? iso : iso + 'Z';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '—';

  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function setupNotificationUI() {
  // Sync sound button icon with persisted preference on load
  const soundBtnInit = document.getElementById('notif-sound-toggle');
  if (soundBtnInit) {
    const iconEl = soundBtnInit.querySelector('i');
    if (iconEl) iconEl.className = notifSoundEnabled ? 'fas fa-volume-up text-xs' : 'fas fa-volume-mute text-xs';
    soundBtnInit.classList.toggle('text-indigo-600', notifSoundEnabled);
  }
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
    try { localStorage.setItem('s2b_notif_sound', String(notifSoundEnabled)); } catch(e) {}
    const icon = soundBtn.querySelector('i');
    icon.className = notifSoundEnabled ? 'fas fa-volume-up text-xs' : 'fas fa-volume-mute text-xs';
    soundBtn.classList.toggle('text-indigo-600', notifSoundEnabled);
    showToast(notifSoundEnabled ? '🔔 Notification sound enabled' : '🔇 Notification sound muted', 'info');
    // Unlock audio context on first gesture (required by browsers)
    if (notifSoundEnabled) {
      const audio = document.getElementById('notif-sound');
      if (audio) { audio.play().then(() => audio.pause()).catch(() => {}); }
    }
  });
}

// FIX #6: Validate tab index before switching
function handleNotifClick(id) {
  const notif = notifications.find(n => n.id === id);
  if (!notif) return;

  notif.is_read = true;
  saveNotifications();
  updateNotifBadge();
  renderNotificationList();

  if (notif.data?.tab !== undefined) {
    const tabIndex = parseInt(notif.data.tab);
    if (tabIndex >= 0 && tabIndex <= 4) {
      window.switchTab(tabIndex);
      if (notif.data.subtab) {
        if (tabIndex === 1) switchOrderSubTab(notif.data.subtab);
        if (tabIndex === 3) switchPortalSubTab(notif.data.subtab);
      }
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
    audio.play().catch((err) => {
      // Browsers block autoplay before a user gesture — this is expected on first load
      console.warn('[Notif] Sound blocked (autoplay policy):', err.message);
    });
  }
}

function notifyNewOrder(order) {
  addNotification({
    type: 'order',
    title: 'New Order',
    message: `Order #${(order.order_id || '').slice(0, 12)} — ${order.delivery_city || 'Unknown'}`,
    data: { tab: 1 },
    icon: 'fa-shopping-bag',
    dedupKey: order.id
  });
}
window.notifyNewOrder = notifyNewOrder;

function notifyPaymentVerified(amount, method) {
  addNotification({
    type: 'payment',
    title: 'Payment Verified',
    message: `₹${Math.round(amount).toLocaleString('en-IN')} via ${method || '—'}`,
    data: { tab: 1, subtab: 'payments' },
    icon: 'fa-check-circle',
    dedupKey: 'payment-' + amount + '-' + method + '-' + Date.now()  // Time-based to allow multiple
  });
}
window.notifyPaymentVerified = notifyPaymentVerified;

/* ==========================================================
   ANALYTICS DASHBOARD
   ========================================================== */
let analyticsLoaded = false;
let analyticsCharts = {};

async function loadAnalytics() {
  if (analyticsLoaded) return;

  try {
    const [{ data: payments }, { data: orders }, { data: quotes }] = await Promise.all([
      supabase.from('payments').select('total_amount, status, advance_paid, due_amount, payment_method, created_at'),
      supabase.from('orders').select('order_status, delivery_city, created_at'),
      supabase.from('quotations').select('status')
    ]);

    renderAnalytics({
      payments: payments || [],
      orders: orders || [],
      quotes: quotes || []
    });

    analyticsLoaded = true;
  } catch (err) {
    console.error('Analytics load failed:', err);
    showToast('Failed to load analytics', 'error');
  }
<<<<<<< HEAD

  loadActionsDashboard();
}
window.loadAnalytics = loadAnalytics;



function renderAnalytics({ payments, orders, quotes }) {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

=======
}
window.loadAnalytics = loadAnalytics;

function renderAnalytics({ payments, orders, quotes }) {
>>>>>>> 1c5cd4d (Update all files and folders)
  // --- Card Metrics ---
  const verifiedPayments = payments.filter(p => p.status === 'verified');
  const totalRevenue = verifiedPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'partial');
  const pendingRevenue = pendingPayments.reduce((sum, p) => {
    const remaining = p.status === 'partial' ? (p.due_amount || 0) : (p.total_amount || 0);
    return sum + remaining;
  }, 0);

  const currentMonthKey = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Thimphu', month: 'short', year: 'numeric'
  }).format(new Date());

  const monthRevenue = verifiedPayments.filter(p => {
    const key = formatBhutanMonth(p.created_at);
    return key === currentMonthKey;
  }).reduce((sum, p) => sum + (p.total_amount || 0), 0);

  const aov = verifiedPayments.length > 0
    ? Math.round(totalRevenue / verifiedPayments.length)
    : 0;

  const todayOrders = orders.filter(o => isTodayBhutan(o.created_at)).length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const quoteRate = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0;

<<<<<<< HEAD
 setText('metric-total-revenue', '₹' + Math.round(totalRevenue).toLocaleString('en-IN'));
setText('metric-pending-revenue', '₹' + Math.round(pendingRevenue).toLocaleString('en-IN'));
setText('metric-month-revenue', '₹' + Math.round(monthRevenue).toLocaleString('en-IN'));
setText('metric-aov', '₹' + aov.toLocaleString('en-IN'));
setText('metric-total-orders', orders.length.toLocaleString('en-IN'));
setText('metric-quote-rate', quoteRate + '%');
setText('metric-today-orders', todayOrders);
=======
  document.getElementById('metric-total-revenue').textContent = '₹' + Math.round(totalRevenue).toLocaleString('en-IN');
  document.getElementById('metric-pending-revenue').textContent = '₹' + Math.round(pendingRevenue).toLocaleString('en-IN');
  document.getElementById('metric-month-revenue').textContent = '₹' + Math.round(monthRevenue).toLocaleString('en-IN');
  document.getElementById('metric-aov').textContent = '₹' + aov.toLocaleString('en-IN');
  document.getElementById('metric-total-orders').textContent = orders.length.toLocaleString('en-IN');
  document.getElementById('metric-quote-rate').textContent = quoteRate + '%';
  document.getElementById('metric-today-orders').textContent = todayOrders;
>>>>>>> 1c5cd4d (Update all files and folders)

  // --- Charts ---
  renderRevenueChart(verifiedPayments);
  renderCityChart(orders);
  renderStatusChart(orders);
  renderPaymentChart(payments);
}

function formatBhutanMonth(isoString) {
  if (!isoString) return null;
  const normalized = /[Z+\-]\d{2}:?\d{2}$|Z$/.test(isoString) ? isoString : isoString + 'Z';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Thimphu', month: 'short', year: 'numeric'
  }).format(d);
}

function isTodayBhutan(isoString) {
  if (!isoString) return false;
  const normalized = /[Z+\-]\d{2}:?\d{2}$|Z$/.test(isoString) ? isoString : isoString + 'Z';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return false;
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Thimphu', day: '2-digit', month: '2-digit', year: 'numeric'
  });
  return fmt.format(d) === fmt.format(new Date());
}

function getLast6MonthsLabels() {
  const labels = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Thimphu', month: 'short', year: 'numeric'
    }).format(d));
  }
  return labels;
}

function destroyChart(id) {
  if (analyticsCharts[id]) {
    analyticsCharts[id].destroy();
    delete analyticsCharts[id];
  }
}

function renderRevenueChart(payments) {
  const labels = getLast6MonthsLabels();
  const data = labels.map(label => {
    return payments.filter(p => formatBhutanMonth(p.created_at) === label)
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);
  });

  destroyChart('revenue');
  const ctx = document.getElementById('revenue-chart').getContext('2d');
  analyticsCharts.revenue = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.map(l => l.split(' ')[0]), // "Jan", "Feb"...
      datasets: [{
        label: 'Revenue (₹)',
        data: data,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e5'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderCityChart(orders) {
  const counts = {};
  orders.forEach(o => {
    const city = o.delivery_city || 'Unknown';
    counts[city] = (counts[city] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  destroyChart('city');
  const ctx = document.getElementById('city-chart').getContext('2d');
  analyticsCharts.city = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Orders',
        data,
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

function renderStatusChart(orders) {
  const counts = {};
  orders.forEach(o => {
    const s = o.order_status || 'pending';
    counts[s] = (counts[s] || 0) + 1;
  });
  const labels = Object.keys(counts).map(s => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
  const data = Object.values(counts);
  const colors = ['#f59e0b', '#4f46e5', '#3b82f6', '#0ea5e9', '#14b8a6', '#06b6d4', '#8b5cf6', '#10b981', '#ef4444'];

  destroyChart('status');
  const ctx = document.getElementById('status-chart').getContext('2d');
  analyticsCharts.status = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
      }
    }
  });
}

function renderPaymentChart(payments) {
  const counts = {};
  payments.forEach(p => {
    const m = p.payment_method || 'Unknown';
    counts[m] = (counts[m] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  destroyChart('payment');
  const ctx = document.getElementById('payment-chart').getContext('2d');
  analyticsCharts.payment = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
      }
    }
  });
}

/* ==========================================================
   CUSTOMER DETAIL MODAL
   ========================================================== */
let currentCustomerId = null;

async function openCustomerModal(userId) {
  currentCustomerId = userId;
  const modal = document.getElementById('customer-modal');
  const content = document.getElementById('customer-modal-content');

  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });

  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, full_name, whatsapp, email, created_at, admin_notes')
      .eq('id', userId)
      .single();

    if (userErr || !user) throw userErr || new Error('User not found');

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, order_id, delivery_city, delivery_address, product_links, order_status, total_amount, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersErr) throw ordersErr;

    const orderTextIds = (orders || []).map(o => o.order_id).filter(Boolean);
    let payments = [];
    if (orderTextIds.length > 0) {
      const { data: pmtData, error: pmtErr } = await supabase
        .from('payments')
        .select('order_id, total_amount, status, advance_paid, due_amount, payment_method, created_at')
        .in('order_id', orderTextIds);
      if (!pmtErr) payments = pmtData || [];
    }

    renderCustomerModal(user, orders || [], payments);
  } catch (err) {
    console.error('Customer modal load failed:', err);
    showToast('Failed to load customer details', 'error');
    closeCustomerModal();
  }
}
window.openCustomerModal = openCustomerModal;

function closeCustomerModal() {
  const modal = document.getElementById('customer-modal');
  const content = document.getElementById('customer-modal-content');
  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
    currentCustomerId = null;
  }, 200);
}
window.closeCustomerModal = closeCustomerModal;

function renderCustomerModal(user, orders, payments) {
  const name = user.full_name || 'Anonymous';
  document.getElementById('customer-modal-name').textContent = name;
  document.getElementById('customer-modal-avatar').textContent = name.charAt(0).toUpperCase();

  const phone = user.whatsapp || '—';
  const joined = user.created_at ? formatBtnDate(user.created_at) : '—';
  document.getElementById('customer-modal-meta').textContent = `+975 ${phone} • Joined ${joined}`;

  document.getElementById('customer-admin-notes').value = user.admin_notes || '';

  const totalOrders = orders.length;
  const verifiedPayments = payments.filter(p => p.status === 'verified');
  const totalSpent = verifiedPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const aov = verifiedPayments.length > 0 ? Math.round(totalSpent / verifiedPayments.length) : 0;
  const isTrusted = verifiedPayments.length >= 3;

  document.getElementById('cust-stat-orders').textContent = totalOrders;
  document.getElementById('cust-stat-spent').textContent = '₹' + Math.round(totalSpent).toLocaleString('en-IN');
  document.getElementById('cust-stat-aov').textContent = '₹' + aov.toLocaleString('en-IN');
  document.getElementById('cust-stat-status').innerHTML = isTrusted
    ? '<span class="inline-flex items-center gap-1 text-emerald-600 text-sm font-semibold"><i class="fas fa-shield-alt text-xs"></i> Trusted</span>'
    : '<span class="text-gray-400 text-sm">Regular</span>';

  const ordersList = document.getElementById('customer-orders-list');
  if (orders.length === 0) {
    ordersList.innerHTML = '<p class="text-sm text-gray-400 italic">No orders found</p>';
  } else {
    const statusColors = {
      pending: 'text-amber-600 bg-amber-50 border-amber-100',
      quoted: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      confirmed: 'text-blue-600 bg-blue-50 border-blue-100',
      ordered: 'text-sky-600 bg-sky-50 border-sky-100',
      reached_jaigaon: 'text-teal-600 bg-teal-50 border-teal-100',
      reached_phuntsholing: 'text-cyan-600 bg-cyan-50 border-cyan-100',
      out_for_delivery: 'text-violet-600 bg-violet-50 border-violet-100',
      shipped: 'text-purple-600 bg-purple-50 border-purple-100',
      delivered: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      cancelled: 'text-red-600 bg-red-50 border-red-100'
    };

    ordersList.innerHTML = orders.map(o => {
      const payment = payments.find(p => p.order_id === o.order_id);
      const total = payment?.total_amount || o.total_amount || 0;
      const date = formatBtnDate(o.created_at);
      const statusClass = statusColors[o.order_status] || statusColors.pending;
      const productCount = safeParseArray(o.product_links).length;

      return `
        <div class="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-box text-gray-400 text-xs"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-gray-900 truncate">${esc(o.order_id || '—')}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded border ${statusClass} font-medium capitalize">${esc((o.order_status || 'pending').replace(/_/g, ' '))}</span>
              </div>
              <div class="text-xs text-gray-500 mt-0.5">${productCount} item${productCount !== 1 ? 's' : ''} • ${esc(o.delivery_city || '—')} • ${date}</div>
            </div>
          </div>
          <div class="text-right flex-shrink-0 ml-3">
            <div class="text-sm font-bold text-gray-900">₹${Math.round(total).toLocaleString('en-IN')}</div>
            <div class="text-[10px] text-gray-400 uppercase">${esc(payment?.payment_method || 'No payment')}</div>
          </div>
        </div>`;
    }).join('');
  }

  const addrList = document.getElementById('customer-addresses-list');
  const uniqueAddresses = [...new Set(orders.map(o => o.delivery_address).filter(Boolean))];
  if (uniqueAddresses.length === 0) {
    addrList.innerHTML = '<span class="text-sm text-gray-400 italic">No addresses recorded</span>';
  } else {
    addrList.innerHTML = uniqueAddresses.map(a => `
      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
        <i class="fas fa-map-marker-alt text-gray-400"></i> ${esc(a)}
      </span>
    `).join('');
  }
}

async function saveAdminNotes() {
  if (!currentCustomerId) return;
  const notes = document.getElementById('customer-admin-notes').value.trim();
  const btn = document.getElementById('btn-save-notes');

  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = 'Saving...';

  try {
    const { error } = await supabase
      .from('users')
      .update({ admin_notes: notes || null, updated_at: new Date().toISOString() })
      .eq('id', currentCustomerId);

    if (error) throw error;
    showToast('Notes saved successfully', 'success');
  } catch (err) {
    console.error('Save notes failed:', err);
    showToast('Failed to save notes: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}
window.saveAdminNotes = saveAdminNotes;

/* ==========================================================
   ORDER ACTIVITY TIMELINE
   ========================================================== */
async function openTimelineModal(orderUuid, orderTextId) {
  const modal = document.getElementById('timeline-modal');
  const content = document.getElementById('timeline-modal-content');
  document.getElementById('timeline-subtitle').textContent = `Order: ${orderTextId || orderUuid.slice(0, 8)}`;
  document.getElementById('timeline-list').innerHTML = '<p class="text-sm text-gray-400 italic">Loading timeline...</p>';

  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });

  try {
    const [orderRes, trackRes, payRes, quoteRes] = await Promise.all([
      supabase.from('orders').select('created_at, order_status, updated_at, cancellation_reason, cancelled_at').eq('id', orderUuid).single(),
      supabase.from('tracking_events').select('status, location, note, created_at').eq('order_id', orderUuid).order('created_at', { ascending: false }),
      supabase.from('payments').select('status, total_amount, advance_paid, due_amount, payment_method, created_at, updated_at').eq('order_id', orderTextId).order('created_at', { ascending: false }),
      supabase.from('quotations').select('status, total_amount, created_at, updated_at').eq('order_id', orderUuid).single()
    ]);

    const events = [];
    const o = orderRes.data;
    if (o) {
      events.push({ time: o.created_at, type: 'order', title: 'Order Submitted', desc: 'Customer placed the order', icon: 'fa-shopping-cart', color: 'bg-gray-500' });
      if (o.order_status === 'cancelled' && o.cancelled_at) {
        events.push({ time: o.cancelled_at, type: 'cancel', title: 'Order Cancelled', desc: o.cancellation_reason || 'No reason provided', icon: 'fa-ban', color: 'bg-red-500' });
      }
    }

    (trackRes.data || []).forEach(t => {
      events.push({ time: t.created_at, type: 'tracking', title: `Status: ${(t.status || '').replace(/_/g, ' ')}`, desc: `${t.location ? `📍 ${t.location}` : ''}${t.note ? ` • ${t.note}` : ''}`, icon: 'fa-truck-fast', color: 'bg-indigo-500' });
    });

    (payRes.data || []).forEach(p => {
      let title = `Payment ${p.status}`;
      if (p.status === 'pending') title = 'Payment Pending';
      if (p.status === 'partial') title = '50% Advance Verified';
      if (p.status === 'verified') title = 'Payment Fully Verified';
      events.push({ time: p.created_at, type: 'payment', title, desc: `₹${Math.round(p.total_amount || 0).toLocaleString('en-IN')} via ${p.payment_method || '—'}`, icon: 'fa-money-bill-wave', color: 'bg-emerald-500' });
    });

    if (quoteRes.data) {
      const q = quoteRes.data;
      const qTitle = q.status === 'accepted' ? 'Quotation Accepted' : q.status === 'rejected' ? 'Quotation Rejected' : 'Quotation Sent';
      events.push({ time: q.created_at, type: 'quote', title: qTitle, desc: `Total quoted: ₹${Math.round(q.total_amount || 0).toLocaleString('en-IN')}`, icon: 'fa-file-invoice-dollar', color: 'bg-amber-500' });
    }

    events.sort((a, b) => new Date(b.time) - new Date(a.time));

    const list = document.getElementById('timeline-list');
    if (events.length === 0) {
      list.innerHTML = '<p class="text-sm text-gray-400 italic">No activity recorded yet.</p>';
    } else {
      list.innerHTML = events.map(e => {
        const date = formatBtnDate(e.time);
        return `
          <div class="relative">
            <div class="absolute -left-[21px] top-0 w-3 h-3 rounded-full ${e.color} ring-4 ring-white"></div>
            <div class="mb-1 flex items-center gap-2">
              <span class="text-xs font-semibold text-gray-900">${esc(e.title)}</span>
              <span class="text-[10px] text-gray-400">${date}</span>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">${esc(e.desc)}</p>
          </div>`;
      }).join('');
    }
  } catch (err) {
    console.error('Timeline load failed:', err);
    document.getElementById('timeline-list').innerHTML = '<p class="text-sm text-red-500">Failed to load timeline.</p>';
  }
}
window.openTimelineModal = openTimelineModal;

function closeTimelineModal() {
  const modal = document.getElementById('timeline-modal');
  const content = document.getElementById('timeline-modal-content');
  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  setTimeout(() => modal.classList.add('hidden'), 200);
}
window.closeTimelineModal = closeTimelineModal;

/* ==========================================================
   CANCELLATION WORKFLOW
   ========================================================== */
let cancelTargetId = null;

function openCancelModal(orderUuid, orderTextId) {
  cancelTargetId = orderUuid;
  document.getElementById('cancel-reason').value = '';
  const modal = document.getElementById('cancel-modal');
  const content = document.getElementById('cancel-modal-content');
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });
}
window.openCancelModal = openCancelModal;

function closeCancelModal() {
  const modal = document.getElementById('cancel-modal');
  const content = document.getElementById('cancel-modal-content');
  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  setTimeout(() => { modal.classList.add('hidden'); cancelTargetId = null; }, 200);
}
window.closeCancelModal = closeCancelModal;

async function confirmCancelOrder() {
  if (!cancelTargetId) return;
  const reason = document.getElementById('cancel-reason').value.trim();
  const btn = document.getElementById('confirm-cancel-btn');
  btn.disabled = true;
  btn.textContent = 'Cancelling...';

  try {
    const { error } = await supabase.from('orders').update({
      order_status: 'cancelled',
      cancellation_reason: reason || null,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', cancelTargetId);

    if (error) throw error;

    const idx = allOrders.findIndex(o => o.id === cancelTargetId);
    if (idx >= 0) {
      allOrders[idx].order_status = 'cancelled';
      allOrders[idx].cancellation_reason = reason;
    }

    closeCancelModal();
    showToast('Order cancelled', 'info');
    renderOrders(allOrders);
    await refreshOrders();
  } catch (err) {
    console.error('Cancel failed:', err);
    showToast('Failed to cancel order: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cancel Order';
  }
}
window.confirmCancelOrder = confirmCancelOrder;

/* ==========================================================
   REFUND WORKFLOW
   ========================================================== */
let refundTargetOrderTextId = null;
let refundMaxAmount = 0;

function openRefundModal(orderTextId, displayId, maxAmount) {
  refundTargetOrderTextId = orderTextId;
  refundMaxAmount = maxAmount;
  document.getElementById('refund-amount').value = maxAmount;
  document.getElementById('refund-reason').value = '';
  document.getElementById('refund-subtitle').textContent = `Order: ${displayId || orderTextId}`;
  const modal = document.getElementById('refund-modal');
  const content = document.getElementById('refund-modal-content');
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });
}
window.openRefundModal = openRefundModal;

function closeRefundModal() {
  const modal = document.getElementById('refund-modal');
  const content = document.getElementById('refund-modal-content');
  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  setTimeout(() => { modal.classList.add('hidden'); refundTargetOrderTextId = null; }, 200);
}
window.closeRefundModal = closeRefundModal;

async function saveRefund() {
  if (!refundTargetOrderTextId) return;
  const amount = parseFloat(document.getElementById('refund-amount').value) || 0;
  const reason = document.getElementById('refund-reason').value.trim();
  const method = document.getElementById('refund-method').value;

  if (amount <= 0 || amount > refundMaxAmount) {
    showToast(`Refund amount must be between 1 and ${refundMaxAmount}`, 'error');
    return;
  }

  const btn = document.getElementById('save-refund-btn');
  btn.disabled = true;
  btn.textContent = 'Recording...';

  try {
    const { error } = await supabase.from('refunds').insert([{
      order_id: refundTargetOrderTextId,
      amount: Math.round(amount),
      reason: reason || null,
      method: method,
      status: 'pending',
      created_at: new Date().toISOString()
    }]);
    if (error) throw error;

    closeRefundModal();
    showToast('Refund recorded and pending processing', 'success');
  } catch (err) {
    console.error('Refund failed:', err);
    showToast('Failed to record refund: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Record Refund';
  }
}
window.saveRefund = saveRefund;

/* ==========================================================
   WHATSAPP TEMPLATES + MESSAGE LOG
   ========================================================== */
async function sendWhatsAppWithTemplate({ phone, templateId, variables = {}, orderTextId, userId, orderUuid }) {
  const tpl = WA_TEMPLATES.find(t => t.id === templateId) || WA_TEMPLATES[0];
  let msg = tpl.message;
  Object.entries(variables).forEach(([k, v]) => {
    msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });

  if (templateId === 'custom') {
    msg = window.prompt('Enter your custom message:', '') || '';
    if (!msg.trim()) return;
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const waUrl = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg);
  window.open(waUrl, '_blank');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('message_logs').insert([{
      user_id: userId || null,
      order_id: orderTextId || null,
      phone: cleanPhone,
      message: msg,
      template_name: tpl.name,
      sent_by: session?.user?.email || 'admin',
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn('Message log failed:', e);
  }
}

<<<<<<< HEAD
window.sendWhatsAppWithTemplate = sendWhatsAppWithTemplate;

=======
>>>>>>> 1c5cd4d (Update all files and folders)
function getTemplateMenuHtml({ phone, orderTextId, total, balance, status, userId, code }) {
  return WA_TEMPLATES.map(t => {
    let vars = {};
    if (t.id === 'otp') vars = { code: code || 'CODE' };
    else if (t.id === 'quote_ready') vars = { order_id: orderTextId, total: total || '0' };
    else if (t.id === 'advance_reminder') vars = { order_id: orderTextId, amount: Math.round((total || 0) * 0.5) };
    else if (t.id === 'balance_reminder') vars = { order_id: orderTextId, amount: balance || '0' };
    else if (t.id === 'tracking_update') vars = { order_id: orderTextId, status: (status || '').replace(/_/g, ' ') };
    else if (t.id === 'delivered') vars = { order_id: orderTextId };
    const varJson = JSON.stringify(vars).replace(/"/g, '&quot;');
<<<<<<< HEAD
    return `<button onclick="window.sendWhatsAppWithTemplate({phone:'${esc(phone)}',templateId:'${t.id}',variables:${varJson},orderTextId:'${esc(orderTextId || '')}',userId:'${esc(userId || '')}')" class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors">${esc(t.name)}</button>`;
=======
    return `<button onclick="window.sendWhatsAppWithTemplate({phone:'${esc(phone)}',templateId:'${t.id}',variables:${varJson},orderTextId:'${esc(orderTextId || '')}',userId:'${userId || ''}'})" class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors">${esc(t.name)}</button>`;
>>>>>>> 1c5cd4d (Update all files and folders)
  }).join('');
}

// Override existing WA functions to show template picker
window.openWaFromOtp = function(phone, code) {
  const menu = document.createElement('div');
  menu.className = 'absolute z-50 bg-white rounded-lg shadow-xl border border-gray-100 py-1 w-56';
  menu.innerHTML = getTemplateMenuHtml({ phone, code });
  document.body.appendChild(menu);
  const rect = event.target.getBoundingClientRect();
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = rect.left + 'px';
  const close = () => menu.remove();
  menu.addEventListener('click', () => setTimeout(close, 50));
  setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
};

window.openWaUser = function(phone) {
  if (!phone || phone === '—') return;
  const clean = String(phone).replace(/\D/g, '');
  const menu = document.createElement('div');
  menu.className = 'absolute z-50 bg-white rounded-lg shadow-xl border border-gray-100 py-1 w-56';
  menu.innerHTML = getTemplateMenuHtml({ phone: clean });
  document.body.appendChild(menu);
<<<<<<< HEAD
 const rect = (event?.target || document.activeElement).getBoundingClientRect();
=======
  const rect = event.target.getBoundingClientRect();
>>>>>>> 1c5cd4d (Update all files and folders)
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = rect.left + 'px';
  const close = () => menu.remove();
  menu.addEventListener('click', () => setTimeout(close, 50));
  setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
};

/* ==========================================================
   MESSAGE LOG TAB
   ========================================================== */
async function loadMessageLogs() {
  const loader = document.getElementById('messages-loader');
  const empty = document.getElementById('messages-empty');
  const wrap = document.getElementById('messages-table-wrap');
  const tbody = document.getElementById('messages-tbody');
  if (!tbody) return;

  loader?.classList.remove('hidden');
  empty?.classList.add('hidden');
  wrap?.classList.add('hidden');

  try {
    const { data, error } = await supabase
      .from('message_logs')
      .select('*, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    allMessageLogs = data || [];
    messagesLoaded = true;
    loader?.classList.add('hidden');

    if (allMessageLogs.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }
    renderMessageLogs(allMessageLogs);
    wrap?.classList.remove('hidden');
  } catch (err) {
    console.error('Load messages failed:', err);
    loader?.classList.add('hidden');
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-red-500 text-sm">${err.message || 'Failed to load messages'}</td></tr>`;
    wrap?.classList.remove('hidden');
    showToast('Failed to load message logs', 'error');
  }
}
window.loadMessageLogs = loadMessageLogs;

async function refreshMessageLogs() {
  messagesLoaded = false;
  await loadMessageLogs();
}
window.refreshMessageLogs = refreshMessageLogs;

function renderMessageLogs(logs) {
  const tbody = document.getElementById('messages-tbody');
  if (!tbody) return;
  tbody.innerHTML = logs.map(m => {
    const name = m.users?.full_name || '—';
    const date = formatBtnDate(m.created_at);
    const preview = (m.message || '').slice(0, 60) + ((m.message || '').length > 60 ? '...' : '');
    return `
      <tr class="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
        <td class="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">${esc(date)}</td>
        <td class="px-6 py-4 text-sm text-gray-900 font-medium">${esc(name)}</td>
        <td class="px-6 py-4 text-xs text-gray-600"><span class="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 font-medium">${esc(m.template_name || 'Custom')}</span></td>
        <td class="px-6 py-4 text-xs font-mono text-gray-500">${esc(m.order_id || '—')}</td>
        <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title="${esc(m.message)}">${esc(preview)}</td>
        <td class="px-6 py-4 text-right text-xs text-gray-400">${esc(m.sent_by || 'admin')}</td>
      </tr>`;
  }).join('');
}

/* ==========================================================
   TRIPS / BATCH MANAGEMENT
   ========================================================== */
async function loadTrips() {
  const loader = document.getElementById('trips-loader');
  const empty = document.getElementById('trips-empty');
  const wrap = document.getElementById('trips-table-wrap');
  const tbody = document.getElementById('trips-tbody');
  if (!tbody) return;

  loader?.classList.remove('hidden');
  empty?.classList.add('hidden');
  wrap?.classList.add('hidden');

  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*, trip_orders(count)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allTrips = data || [];
    tripsLoaded = true;
    loader?.classList.add('hidden');

    if (allTrips.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }
    renderTrips(allTrips);
    wrap?.classList.remove('hidden');
  } catch (err) {
    console.error('Load trips failed:', err);
    loader?.classList.add('hidden');
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-red-500 text-sm">${err.message || 'Failed to load trips'}</td></tr>`;
    wrap?.classList.remove('hidden');
    showToast('Failed to load trips', 'error');
  }
}
window.loadTrips = loadTrips;

async function refreshTrips() {
  tripsLoaded = false;
  await loadTrips();
}
window.refreshTrips = refreshTrips;

function renderTrips(trips) {
  const tbody = document.getElementById('trips-tbody');
  if (!tbody) return;

  const statusColors = {
    preparing: 'bg-amber-50 text-amber-700 border-amber-100',
    in_transit: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelled: 'bg-red-50 text-red-700 border-red-100'
  };

  tbody.innerHTML = trips.map(t => {
    const count = t.trip_orders?.count || 0;
    const date = formatBtnDate(t.created_at);
    const status = t.status || 'preparing';
    return `
      <tr class="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
        <td class="px-6 py-4 text-sm font-semibold text-gray-900">${esc(t.name)}</td>
        <td class="px-6 py-4 text-sm text-gray-700">${esc(t.city || 'Mixed')}</td>
        <td class="px-6 py-4 text-sm text-gray-700"><span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">${count} order${count!==1?'s':''}</span></td>
        <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[status]||statusColors.preparing}"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>${esc(status.replace(/_/g,' '))}</span></td>
        <td class="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">${date}</td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button onclick="window.openTripDetailModal('${t.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100" title="Manage Trip"><i class="fas fa-cog"></i> Manage</button>
            <button onclick="window.deleteTrip('${t.id}')" class="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete"><i class="fas fa-trash-alt text-xs"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* Create Trip */
function openTripModal() {
  tripSelectedOrders.clear();
  document.getElementById('trip-name').value = '';
  document.getElementById('trip-city').value = '';
  document.getElementById('trip-selected-count').textContent = '0';
  renderTripOrderSelector();
  const modal = document.getElementById('trip-modal');
  const content = document.getElementById('trip-modal-content');
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });
}
window.openTripModal = openTripModal;

function closeTripModal() {
  const modal = document.getElementById('trip-modal');
  const content = document.getElementById('trip-modal-content');
  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  setTimeout(() => modal.classList.add('hidden'), 200);
}
window.closeTripModal = closeTripModal;

function renderTripOrderSelector() {
  const container = document.getElementById('trip-orders-list');
  const eligible = allOrders.filter(o => o.order_status !== 'cancelled' && o.order_status !== 'delivered');
  if (eligible.length === 0) {
    container.innerHTML = '<p class="p-4 text-sm text-gray-400 italic">No eligible orders available.</p>';
    return;
  }
  container.innerHTML = eligible.map(o => {
    const user = o.users || {};
    const checked = tripSelectedOrders.has(o.id) ? 'checked' : '';
    return `
      <label class="flex items-center gap-3 p-3 hover:bg-white cursor-pointer transition-colors">
        <input type="checkbox" value="${o.id}" onchange="window.toggleTripOrder(this)" ${checked} class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-900 truncate">${esc(o.order_id || '—')}</span>
            <span class="text-[10px] text-gray-500">${esc(o.delivery_city || '—')}</span>
          </div>
          <div class="text-xs text-gray-500">${esc(user.full_name || '—')} • ${esc(user.whatsapp || '—')}</div>
        </div>
      </label>`;
  }).join('');
}

function toggleTripOrder(checkbox) {
  if (checkbox.checked) tripSelectedOrders.add(checkbox.value);
  else tripSelectedOrders.delete(checkbox.value);
  document.getElementById('trip-selected-count').textContent = tripSelectedOrders.size;
}
window.toggleTripOrder = toggleTripOrder;

async function saveTrip() {
  const name = document.getElementById('trip-name').value.trim();
  const city = document.getElementById('trip-city').value;
  if (!name) { showToast('Enter a trip name', 'error'); return; }
  if (tripSelectedOrders.size === 0) { showToast('Select at least one order', 'error'); return; }

  const btn = document.getElementById('save-trip-btn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    const { data: trip, error: tripErr } = await supabase.from('trips').insert([{
      name, city: city || null, status: 'preparing', created_at: new Date().toISOString()
    }]).select().single();
    if (tripErr) throw tripErr;

    const links = Array.from(tripSelectedOrders).map(oid => ({
      trip_id: trip.id,
      order_id: oid
    }));
    const { error: linkErr } = await supabase.from('trip_orders').insert(links);
    if (linkErr) throw linkErr;

    closeTripModal();
    showToast('Trip created with ' + tripSelectedOrders.size + ' orders', 'success');
    await refreshTrips();
  } catch (err) {
    console.error('Create trip failed:', err);
    showToast('Failed to create trip: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Trip';
  }
}
window.saveTrip = saveTrip;

/* Trip Detail / Bulk Update */
let currentTripId = null;

async function openTripDetailModal(tripId) {
  currentTripId = tripId;
  const trip = allTrips.find(t => t.id === tripId);
  if (!trip) return;

  document.getElementById('trip-detail-id').value = tripId;
  document.getElementById('trip-detail-name').textContent = trip.name;
  document.getElementById('trip-detail-meta').textContent = 'Loading orders...';
  document.getElementById('trip-bulk-status').value = 'reached_jaigaon';
  document.getElementById('trip-bulk-note').value = '';

  const modal = document.getElementById('trip-detail-modal');
  const content = document.getElementById('trip-detail-modal-content');
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
    content?.classList.remove('scale-95');
    content?.classList.add('scale-100');
  });

  try {
    const { data, error } = await supabase
      .from('trip_orders')
      .select('order_id, orders(id, order_id, users(full_name, whatsapp), delivery_city, order_status)')
      .eq('trip_id', tripId);

    if (error) throw error;

    const list = document.getElementById('trip-detail-orders');
    const orders = (data || []).map(d => d.orders).filter(Boolean);
    document.getElementById('trip-detail-meta').textContent = `${orders.length} orders`;

    if (orders.length === 0) {
      list.innerHTML = '<p class="text-sm text-gray-400 italic">No orders in this trip.</p>';
    } else {
      list.innerHTML = orders.map(o => {
        const u = o.users || {};
        return `
          <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 text-sm">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-semibold text-gray-900 truncate">${esc(o.order_id || '—')}</span>
              <span class="text-[10px] text-gray-500">${esc(o.delivery_city || '—')}</span>
            </div>
            <div class="text-xs text-gray-500 flex-shrink-0">${esc(u.full_name || '—')}</div>
          </div>`;
      }).join('');
    }
  } catch (err) {
    console.error('Trip detail load failed:', err);
    document.getElementById('trip-detail-orders').innerHTML = '<p class="text-sm text-red-500">Failed to load orders.</p>';
  }
}
window.openTripDetailModal = openTripDetailModal;

function closeTripDetailModal() {
  const modal = document.getElementById('trip-detail-modal');
  const content = document.getElementById('trip-detail-modal-content');
  modal.classList.remove('opacity-100');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  setTimeout(() => { modal.classList.add('hidden'); currentTripId = null; }, 200);
}
window.closeTripDetailModal = closeTripDetailModal;

async function bulkUpdateTrip() {
  if (!currentTripId) return;
  const status = document.getElementById('trip-bulk-status').value;
  const note = document.getElementById('trip-bulk-note').value.trim();

  const btn = document.getElementById('trip-bulk-update-btn');
  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    const { data: links, error: linkErr } = await supabase
      .from('trip_orders')
      .select('order_id')
      .eq('trip_id', currentTripId);
    if (linkErr) throw linkErr;

    const orderIds = (links || []).map(l => l.order_id);
    if (orderIds.length === 0) { showToast('No orders to update', 'error'); return; }

    const now = new Date().toISOString();
    const trackingRows = orderIds.map(oid => ({
      order_id: oid,
      status: status,
      location: note || null,
      note: note || `Bulk updated via trip: ${status.replace(/_/g, ' ')}`,
      created_at: now
    }));

    const { error: trackErr } = await supabase.from('tracking_events').insert(trackingRows);
    if (trackErr) throw trackErr;

    const { error: orderErr } = await supabase.from('orders').update({
      order_status: status,
      updated_at: now
    }).in('id', orderIds);
    if (orderErr) throw orderErr;

    const { error: tripErr } = await supabase.from('trips').update({
      status: status === 'delivered' ? 'delivered' : 'in_transit',
      updated_at: now
    }).eq('id', currentTripId);
    if (tripErr) throw tripErr;

    closeTripDetailModal();
    showToast(`Updated ${orderIds.length} orders to ${status.replace(/_/g, ' ')}`, 'success');
    await refreshTrips();
    if (currentOrderSubTab === 'orders') await refreshOrders();
  } catch (err) {
    console.error('Bulk update failed:', err);
    showToast('Failed to update trip: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update All Orders';
  }
}
window.bulkUpdateTrip = bulkUpdateTrip;

async function deleteTrip(tripId) {
  if (!confirm('Delete this trip? Orders will NOT be deleted.')) return;
  try {
    const { error } = await supabase.from('trips').delete().eq('id', tripId);
    if (error) throw error;
    showToast('Trip deleted', 'success');
    await refreshTrips();
  } catch (err) {
    showToast('Failed to delete trip: ' + err.message, 'error');
  }
}
window.deleteTrip = deleteTrip;

/* ==========================================================
   PENDING ACTION DASHBOARD (Analytics Tab)
   ========================================================== */
async function loadActionsDashboard() {
  try {
<<<<<<< HEAD
    const [{ count: pendingReviews }, { data: pendingQuoteOrders }, { data: pendingPay }, { data: forwardOrders }] = await Promise.all([
=======
    const [
      { count: pendingReviews, error: e1 },
      { data: pendingQuoteOrders, error: e2 },
      { data: pendingPay, error: e3 },
      { data: forwardOrders, error: e4 }
    ] = await Promise.all([
>>>>>>> 1c5cd4d (Update all files and folders)
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('orders').select('id').eq('order_status', 'pending'),
      supabase.from('payments').select('id').eq('status', 'pending'),
      supabase.from('orders').select('id').in('order_status', ['confirmed', 'ordered'])
    ]);

<<<<<<< HEAD
=======
    if (e1) console.warn('Pending reviews count error:', e1);
    if (e2) console.warn('Pending orders error:', e2);
    if (e3) console.warn('Pending payments error:', e3);
    if (e4) console.warn('Forward orders error:', e4);

>>>>>>> 1c5cd4d (Update all files and folders)
    document.getElementById('todo-reviews').textContent = pendingReviews || 0;
    document.getElementById('todo-quotes').textContent = (pendingQuoteOrders || []).length;
    document.getElementById('todo-payments').textContent = (pendingPay || []).length;
    document.getElementById('todo-forward').textContent = (forwardOrders || []).length;
  } catch (err) {
    console.error('Actions dashboard failed:', err);
  }
}

/* ==========================================================
   EVENT WIRING (add to existing block)
   ========================================================== */
// Add these inside your existing event wiring section:
document.getElementById('timeline-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeTimelineModal(); });
document.getElementById('cancel-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeCancelModal(); });
document.getElementById('refund-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeRefundModal(); });
document.getElementById('trip-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeTripModal(); });
document.getElementById('trip-detail-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeTripDetailModal(); });

// Profit auto-calc listeners
['quote-actual-product', 'quote-actual-shipping', 'quote-actual-customs'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateQuoteProfit);
});

function updateQuoteProfit() {
  const product = parseFloat(document.getElementById('quote-product-price')?.value) || 0;
  const shipping = parseFloat(document.getElementById('quote-shipping')?.value) || 0;
  const service = parseFloat(document.getElementById('quote-service')?.value) || 0;
  const delivery = parseFloat(document.getElementById('quote-delivery')?.value) || 0;
  const actualProduct = parseFloat(document.getElementById('quote-actual-product')?.value) || 0;
  const actualShipping = parseFloat(document.getElementById('quote-actual-shipping')?.value) || 0;
  const actualCustoms = parseFloat(document.getElementById('quote-actual-customs')?.value) || 0;
  const total = product + shipping + service + delivery;
  const profit = total - (actualProduct + actualShipping + actualCustoms);
  const el = document.getElementById('quote-profit-display');
  if (el) {
    el.textContent = '₹ ' + Math.round(profit).toLocaleString('en-IN');
    el.className = 'text-lg font-bold ' + (profit < 0 ? 'text-red-600' : 'text-emerald-700');
  }
}

/* ==========================================================
   START
   ========================================================== */
init();