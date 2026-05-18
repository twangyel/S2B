// ==========================================================
//  Shop2Bhutan — main.js (corrected)
//  Script tag in index.html must have type="module"
// ==========================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ==========================================================
//  SUPABASE — replace with your real project URL and anon key.
//  The anon key is public (visible in browser source), so make
//  sure your Supabase RLS policy on the `orders` table only
//  allows INSERT for anonymous/unauthenticated users.
// ==========================================================
const supabase = createClient(
  "https://deecrnfbvgbzyybqhywy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8"
);

/* ==========================================================
   CONFIGURATION — replace with your Google Apps Script URL
   (used only for the Reviews feature)
   ========================================================== */


/* ==========================================================
   HAMBURGER
   ========================================================== */
var hamburger  = document.getElementById('hamburger');
var mobileMenu = document.getElementById('mobileMenu');
var mainNav    = document.getElementById('mainNav');

hamburger.addEventListener('click', function(e) {
  e.stopPropagation();
  mobileMenu.classList.toggle('open');
});
document.querySelectorAll('.mobile-menu .nav-btn').forEach(function(btn) {
  btn.addEventListener('click', function() { mobileMenu.classList.remove('open'); });
});
document.addEventListener('click', function(e) {
  if (!mainNav.contains(e.target)) mobileMenu.classList.remove('open');
});

/* ==========================================================
   TOAST
   ========================================================== */
function showToast(msg, duration) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, duration || 2500);
}

/* ==========================================================
   FAQ ACCORDION
   ========================================================== */
function toggleFaq(el) {
  el.classList.toggle('open');
}

// Expose to inline onclick handlers (needed because this is a module)
window.toggleFaq = toggleFaq;

/* ==========================================================
   FEE ESTIMATOR
   ========================================================== */
var SHIPPING_ESTIMATE = 100;

function calcEstimate() {
  var price    = parseFloat(document.getElementById('estPrice').value);
  var dlcharge = parseFloat(document.getElementById('dcharge').value);

  if (isNaN(price) || price <= 0) {
    document.getElementById('estBase').textContent          = '₹ —';
    document.getElementById('estServiceCharge').textContent = '₹ —';
    document.getElementById('estShipping').textContent      = '₹ —';
    document.getElementById('dchargeDisplay').textContent   = '₹ —';
    document.getElementById('estTotal').textContent         = '₹ —';
    return;
  }

  var rate       = price < 2000 ? 0.15 : price <= 5999 ? 0.10 : 0.08;
  var serviceFee = Math.round(price * rate);
  var shipping   = SHIPPING_ESTIMATE;
  var total      = Math.round(price + serviceFee + shipping + (isNaN(dlcharge) ? 0 : dlcharge));

  document.getElementById('estBase').textContent          = '₹ ' + Math.round(price).toLocaleString('en-IN');
  document.getElementById('estServiceCharge').textContent = '₹ ' + serviceFee.toLocaleString('en-IN');
  document.getElementById('estShipping').textContent      = '~₹ ' + shipping.toLocaleString('en-IN');
  document.getElementById('dchargeDisplay').textContent   = '₹ ' + Math.round(isNaN(dlcharge) ? 0 : dlcharge).toLocaleString('en-IN');
  document.getElementById('estTotal').textContent         = '₹ ' + total.toLocaleString('en-IN');
}

window.calcEstimate = calcEstimate;

/* ==========================================================
   FILE UPLOAD DISPLAY
   ========================================================== */
function handleFileSelect(input) {
  var list  = document.getElementById('fileList');
  var errEl = document.getElementById('err-files');
  list.innerHTML = '';
  errEl.classList.remove('show');
  var MAX   = 5 * 1024 * 1024;
  var valid = true;
  Array.from(input.files).forEach(function(f) {
    if (f.size > MAX) {
      errEl.textContent = f.name + ' exceeds 5 MB limit.';
      errEl.classList.add('show');
      valid = false;
      return;
    }
    var chip = document.createElement('div');
    chip.className = 'file-chip';
    chip.textContent = f.name;
    list.appendChild(chip);
  });
  if (!valid) input.value = '';
}

window.handleFileSelect = handleFileSelect;

/* ==========================================================
   PRODUCT ROWS
   ========================================================== */
function buildProductRow() {
  var row = document.createElement('div');
  row.className = 'product-row';
  row.innerHTML = [
    '<div class="product-row-top">',
      '<input type="text" name="product_links" placeholder="Paste Amazon / Flipkart / Myntra / Meesho link" oninput="onLinkInput(this)">',
      '<div class="qty-wrap">',
        '<label>Qty</label>',
        '<input type="number" name="quantities" value="1" min="1" aria-label="Quantity" style="width:72px;" placeholder="1">',
      '</div>',
      '<button type="button" class="remove-btn" onclick="removeProduct(this)" title="Remove" aria-label="Remove product">',
        '<i class="fa-solid fa-trash"></i>',
      '</button>',
    '</div>',
    '<div class="url-warning"><i class="fa-solid fa-triangle-exclamation"></i> <span>Double-check this link — it doesn\'t look like a supported store URL.</span></div>',
    '<div class="product-preview"></div>',
  ].join('');
  return row;
}

function addProductRow() {
  document.getElementById('productsContainer').appendChild(buildProductRow());
}

function removeProduct(btn) {
  var rows = document.querySelectorAll('.product-row');
  if (rows.length > 1) btn.closest('.product-row').remove();
}

window.addProductRow = addProductRow;
window.removeProduct = removeProduct;

// Initialise first row on page load
addProductRow();

/* ==========================================================
   URL VALIDATION
   ========================================================== */
var SUPPORTED = ['amazon.in', 'flipkart.com', 'myntra.com', 'meesho.com'];
function isSupported(url) {
  try {
    var host = new URL(url).hostname.replace('www.', '');
    return SUPPORTED.some(function(s) { return host === s || host.endsWith('.' + s); });
  } catch(e) { return false; }
}

/* ==========================================================
   PRODUCT PREVIEW
   ========================================================== */
var debounceMap = {};

function onLinkInput(input) {
  var row     = input.closest('.product-row');
  var warn    = row.querySelector('.url-warning');
  var preview = row.querySelector('.product-preview');
  var val     = input.value.trim();

  if (val.startsWith('http') && !isSupported(val)) {
    warn.classList.add('show');
  } else {
    warn.classList.remove('show');
  }

  var id = input._previewId || (input._previewId = Math.random().toString(36).slice(2));
  clearTimeout(debounceMap[id]);

  if (!val.startsWith('http')) {
    preview.style.display = 'none';
    return;
  }

  preview.style.display = 'block';
  preview.innerHTML = '<div class="preview-status"><div class="preview-spinner"></div> Fetching preview…</div>';

  debounceMap[id] = setTimeout(function() { fetchPreview(input, val); }, 900);
}

window.onLinkInput = onLinkInput;

function fetchPreview(input, url) {
  var row     = input.closest('.product-row');
  var preview = row.querySelector('.product-preview');
  if (input.value.trim() !== url) return;

  var brandFallback = 'Product';
  try {
    var host  = new URL(url).hostname.replace('www.', '');
    var brand = host.split('.')[0];
    brandFallback = brand.charAt(0).toUpperCase() + brand.slice(1);
  } catch(e) {}

  var proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
  var done = false;

  function showFromMeta(html) {
    if (done) return;
    var parser = new DOMParser();
    var doc    = parser.parseFromString(html, 'text/html');
    var title  = ((doc.querySelector('meta[property="og:title"]')  || {}).content)
              || ((doc.querySelector('meta[name="og:title"]')      || {}).content)
              || doc.title || '';
    var imgUrl = ((doc.querySelector('meta[property="og:image"]')  || {}).content)
              || ((doc.querySelector('meta[name="og:image"]')      || {}).content) || '';
    var site   = ((doc.querySelector('meta[property="og:site_name"]') || {}).content) || brandFallback;

    title = title.replace(/\s*[-|–]\s*(Amazon|Flipkart|Myntra|Meesho).*/i, '').trim();
    if (title.length > 100) title = title.slice(0, 100) + '…';

    if (!title && !imgUrl) { tryMicrolink(); return; }
    done = true;
    renderPreview(preview, title || brandFallback + ' product', imgUrl, site);
  }

  function tryMicrolink() {
    if (done) return;
    fetch('https://api.microlink.io/?url=' + encodeURIComponent(url) +
          '&palette=false&audio=false&video=false&iframe=false')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (done) return;
        if (data.status !== 'success') { showFallback(); return; }
        done = true;
        var d     = data.data;
        var title = (d.title || '').replace(/\s*[-|–]\s*(Amazon|Flipkart|Myntra|Meesho).*/i, '').trim();
        renderPreview(preview,
          title || brandFallback + ' product',
          (d.image && d.image.url) || '',
          d.publisher || brandFallback);
      })
      .catch(showFallback);
  }

  function showFallback() {
    if (done) return;
    done = true;
    var slug = '';
    try {
      slug = decodeURIComponent(new URL(url).pathname)
        .split('/').filter(Boolean)
        .find(function(s) { return s.length > 8 && !/^[0-9]+$/.test(s); }) || '';
      slug = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
      if (slug.length > 80) slug = slug.slice(0, 80) + '…';
    } catch(e) {}
    renderPreview(preview, slug || brandFallback + ' product', '', brandFallback, true);
  }

  fetch(proxyUrl)
    .then(function(r) { return r.json(); })
    .then(function(data) { showFromMeta(data.contents || ''); })
    .catch(tryMicrolink);

  setTimeout(showFallback, 6000);
}

function renderPreview(preview, title, imgUrl, source, isFallback) {
  if (preview.closest('.product-row').querySelector('input[name="product_links"]').value.trim() === '') {
    preview.style.display = 'none';
    return;
  }
  preview.style.display = 'block';

  var imgHtml      = imgUrl
    ? '<img class="preview-img" src="' + escHtml(imgUrl) + '" alt="Product" onerror="this.style.display=\'none\'">'
    : '';
  var fallbackNote = isFallback
    ? '<div style="font-size:0.78rem;color:#f97316;margin-top:4px;"><i class="fa-solid fa-circle-info"></i> Preview unavailable — link saved.</div>'
    : '';

  preview.innerHTML = [
    '<div class="preview-inner">',
      imgHtml,
      '<div class="preview-info">',
        '<div class="preview-title"></div>',
        '<div class="preview-source"></div>',
        fallbackNote,
      '</div>',
    '</div>',
  ].join('');

  preview.querySelector('.preview-title').textContent  = title;
  preview.querySelector('.preview-source').textContent = source;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ==========================================================
   CLEAR FORM
   ========================================================== */
function clearForm() {
  document.getElementById('orderForm').reset();
  document.getElementById('fileList').innerHTML = '';
  document.getElementById('productsContainer').innerHTML = '';
  addProductRow();
  document.querySelectorAll('.field-error-msg').forEach(function(el) { el.classList.remove('show'); });
  document.querySelectorAll('.product-preview').forEach(function(el) { el.style.display = 'none'; });
}

window.clearForm = clearForm;

/* ==========================================================
   VALIDATION HELPERS
   ========================================================== */
function validatePhone(val) {
  return /^(\+975[\s-]?)?[0-9]{7,8}$/.test(val.replace(/\s/g, ''));
}

function showErr(id, show) {
  document.getElementById(id).classList[show ? 'add' : 'remove']('show');
}

/* ==========================================================
   ORDER ID GENERATION
   ========================================================== */
function generateOrderId() {
  var now    = new Date();
  var year   = String(now.getFullYear()).slice(2);
  var month  = String(now.getMonth() + 1).padStart(2, '0');
  var day    = String(now.getDate()).padStart(2, '0');
  var suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return 'S2B-' + year + month + day + '-' + suffix;
}

/* ==========================================================
   SANITIZE HELPER
   ========================================================== */
function sanitize(str) {
  return (str || '').replace(/[*_~`]/g, '').trim();
}

/* ==========================================================
   COPY ORDER ID
   ========================================================== */
document.getElementById('popupOrderId').addEventListener('click', function() {
  var text = this.textContent;
  if (!text || text === '—') return;
  var self = this;
  navigator.clipboard.writeText(text).then(function() {
    showToast('Order ID copied!');
    self.style.opacity = '0.6';
    setTimeout(function() { self.style.opacity = ''; }, 600);
  }).catch(function() {
    // Fallback for browsers without Clipboard API
    var el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('Order ID copied!');
  });
});

/* ==========================================================
   FILE UPLOAD TO SUPABASE STORAGE
   FIX: now accepts (file, orderId) parameters and returns the
        public URL of the uploaded file (or throws on error).
   ========================================================== */
async function uploadFile(file, orderId) {
  const ext      = file.name.split('.').pop();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path     = `${orderId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from('order-files')
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from('order-files')
    .getPublicUrl(path);

  return data.publicUrl;
}

/* ==========================================================
   FORM SUBMISSION
   ========================================================== */
var form      = document.getElementById('orderForm');
var submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async function(e) {
  e.preventDefault();

  // ── Read field values ──
  const nameVal    = sanitize(document.getElementById('fullName').value);
  const phoneVal   = sanitize(document.getElementById('whatsapp').value);
  const cityVal    = sanitize(document.getElementById('deliveryCity').value);
  const addressVal = sanitize(document.getElementById('address').value);

  // ── Collect all product rows ──
  const linkInputs = form.querySelectorAll('input[name="product_links"]');
  const qtyInputs  = form.querySelectorAll('input[name="quantities"]');
  const links = [];
  const qtys  = [];
  linkInputs.forEach(function(inp, i) {
    const link = inp.value.trim();
    if (link) {
      links.push(link);
      qtys.push(qtyInputs[i] ? qtyInputs[i].value.trim() : '1');
    }
  });

  // ── Validate ──
  var hasError = false;
  showErr('err-name',    !nameVal);
  showErr('err-phone',   !validatePhone(phoneVal));
  showErr('err-city',    !cityVal);
  showErr('err-address', !addressVal);
  if (!nameVal || !validatePhone(phoneVal) || !cityVal || !addressVal) hasError = true;

  if (links.length === 0) {
    showToast('Please add at least one product link.');
    hasError = true;
  }

  if (hasError) return;

  // ── UI: loading state ──
  submitBtn.disabled    = true;
  submitBtn.textContent = 'Submitting…';

  // ── Generate order ID ──
  const orderId = generateOrderId();

  // ── Upload files if any ──
  // FIX: file upload failures show a toast warning but do NOT block
  //      the order from being submitted — uploaded URLs are saved
  //      if available, otherwise the order proceeds without them.
  const fileInput    = document.getElementById('fileInput');
  const uploadedUrls = [];

  if (fileInput && fileInput.files.length > 0) {
    for (const file of fileInput.files) {
      try {
        const url = await uploadFile(file, orderId);
        uploadedUrls.push(url);
      } catch (err) {
        console.error('File upload failed for', file.name, err);
        showToast('⚠️ Could not upload ' + file.name + ' — continuing without it.', 4000);
      }
    }
  }

  try {
    // ── Supabase insert ──
    const { error } = await supabase.from('orders').insert([{
      order_id:         orderId,
      full_name:        nameVal,
      whatsapp:         phoneVal,
      delivery_city:    cityVal,
      delivery_address: addressVal,
      product_links:    links.join('\n'),
      quantities:       qtys.join(', '),
      screenshot_url:   uploadedUrls.join(', '),
      status:           'pending',
    }]);

    if (error) throw error;

    // ── Build WhatsApp confirmation message ──
    const productsText = links.map(function(link, i) {
      return '  ' + (i + 1) + '. ' + link + ' (Qty: ' + (qtys[i] || '1') + ')';
    }).join('\n');

    const fileCount      = fileInput ? fileInput.files.length : 0;
    const screenshotNote = fileCount > 0
      ? '\n\n📎 Screenshots: ' + fileCount + ' file' + (fileCount > 1 ? 's' : '') + ' uploaded via form.'
      : '';

    const message =
      'Hello Shop2Bhutan,\n\n' +
      '🆔 Order ID: '  + orderId    + '\n\n' +
      '📦 New Order Request\n\n'              +
      '👤 Name: '      + nameVal    + '\n'   +
      '📱 WhatsApp: '  + phoneVal   + '\n'   +
      '🏙️ City: '      + cityVal    + '\n'   +
      '📍 Address: '   + addressVal + '\n\n' +
      '🛒 Products:\n' + productsText        +
      screenshotNote   + '\n\n'              +
      'Please confirm availability, total price (including service charge), and next steps.';

    document.getElementById('whatsappConfirmBtn').href =
      'https://wa.me/97577113302?text=' + encodeURIComponent(message);

    const popupOrderEl = document.getElementById('popupOrderId');
    if (popupOrderEl) popupOrderEl.textContent = orderId;
    document.getElementById('copyNote').textContent = 'Tap the ID above to copy it';

    document.getElementById('successPopup').classList.add('open');

  } catch (err) {
    console.error('FULL SUPABASE ERROR:', err);
    showToast('❌ Failed to submit order: ' + (err.message || 'Unknown error'), 4000);
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Submit Order Request';
  }
});

/* ==========================================================
   SUCCESS POPUP
   ========================================================== */
function closePopup() {
  document.getElementById('successPopup').classList.remove('open');
  clearForm();
}

window.closePopup = closePopup;

/* ==========================================================
   REVIEW MODAL
   ========================================================== */
/* ==========================================================
   REVIEWS (CLEAN SUPABASE VERSION)
========================================================== */

function openReviewForm() {
  document.getElementById('reviewModal').classList.add('open');
}

function closeReviewForm() {
  document.getElementById('reviewModal').classList.remove('open');

  document.getElementById('reviewName').value = '';
  document.getElementById('reviewLocation').value = '';
  document.getElementById('reviewRating').value = '5';
  document.getElementById('reviewText').value = '';
}

window.openReviewForm = openReviewForm;
window.closeReviewForm = closeReviewForm;

/* ---------------- SUBMIT REVIEW ---------------- */

async function submitReview() {
  const name = document.getElementById('reviewName').value.trim();
  const location = document.getElementById('reviewLocation').value.trim();
  const rating = document.getElementById('reviewRating').value;
  const message = document.getElementById('reviewText').value.trim();

  if (!name || !message) {
    showToast("Please fill all required fields");
    return;
  }

  const btn = document.getElementById('reviewSubmitBtn');
  btn.disabled = true;
  btn.textContent = "Submitting...";

  try {
  const orderId = document.getElementById('reviewOrderId').value.trim();
  const { error } = await supabase
  .from("reviews")
  .insert([{
    full_name: name,
    city: location || "Bhutan",
    rating: parseInt(rating),
    message: message,
    order_id: orderId || null,
    is_verified_buyer: orderId ? true : false,
    is_approved: false
  }]);

    if (error) throw error;

    showToast("Review submitted successfully!");
    closeReviewForm();
    loadReviews();

  } catch (err) {
  console.error("FULL REVIEW ERROR:", err);
  console.log("SUPABASE ERROR DETAIL:", err?.message, err?.details, err?.hint);

  showToast("Failed to submit review: " + (err.message || "unknown error"));
} finally {
    btn.disabled = false;
    btn.textContent = "Submit Review";
  }
}

window.submitReview = submitReview;

/* ---------------- LOAD REVIEWS ---------------- */

function loadReviews() {
  const grid = document.getElementById('testiGrid');

  if (!grid) return;

  grid.innerHTML = "Loading reviews...";

  supabase
    .from('reviews')
    .select('*')
    .eq('is_approved', true) //Approve the review or not. false to show on
    .order('created_at', { ascending: false })
    .limit(3) //Accomodate more user review in the section
    .then(({ data, error }) => {
      if (error) {
        console.error(error);
        grid.innerHTML = "Failed to load reviews";
        return;
      }

      if (!data || data.length === 0) {
        grid.innerHTML = "No reviews yet.";
        return;
      }

      grid.innerHTML = data.map(r => `
        <div class="testi-card">
          <div class="testi-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
          <p class="testi-text">${escapeHtml(r.message)}</p>
          <div class="testi-author">
            <div class="testi-avatar">${getInitials(r.full_name)}</div>
            <div>
             <div class="testi-name">
                      ${escapeHtml(r.full_name)}
                      ${r.is_verified_buyer ? `
  <span class="verified-badge">
    <i class="fa-solid fa-circle-check"></i>
    Verified Buyer
  </span>
` : ""}
              </div>
              <div class="testi-location">${escapeHtml(r.city || "Bhutan")}</div>
            </div>
          </div>
        </div>
      `).join('');
    });
}

window.loadReviews = loadReviews;

/* ---------------- HELPERS ---------------- */

function getInitials(name) {
  return (name || "A")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------------- AUTO LOAD ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  loadReviews();
});