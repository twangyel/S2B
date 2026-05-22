// ==========================================================
//  Shop2Bhutan — main.js
//  Script tag in index.html must have type="module"
//
//  FIXES APPLIED (v2):
//  1. selectPayment() defined — was missing, breaking step 4 entirely
//  2. #err-files element added in HTML; handler no longer crashes on null
//  3. Progress bar loop fixed: now iterates i <= 5 (was i <= 4)
//  4. buildReview() now triggered at target === 5 (was === 4)
//  5. reviewPaymentMethod now populated in buildReview()
//  6. clearForm() defined once here only; removed from index.html
//  7. escHtml() defined once here only; removed from index.html
//  8. validatePhone() defined once here only; removed from index.html
//  9. calcEstimate() city-sync dead code removed (target was hidden input)
// 10. quantities stored as integers, not strings
// 11. screenshot_urls stored as a proper array (jsonb), not joined string
// 12. removeProduct() now scopes to productsContainer, not whole document
//
//  RLS REMINDER (nothing to fix in JS — must be done in Supabase):
//  → orders table  : anon INSERT only. SELECT/UPDATE/DELETE blocked.
//  → reviews table : anon INSERT only. SELECT allowed for is_approved=true only.
//  → order-files bucket : anon upload allowed, public read allowed.
// ==========================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ==========================================================
//  SUPABASE
//  The anon key is intentionally public (browser-visible).
//  Security relies entirely on Supabase RLS policies.
// ==========================================================
const supabase = createClient(
  "https://deecrnfbvgbzyybqhywy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8"
);

/* ==========================================================
   SHARED HELPERS — defined once, exposed on window for inline scripts
   ========================================================== */

// HTML escape — single authoritative copy
function escHtml(s) {
  return (s || '')
    .replace(/&/g,  '&amp;')
    .replace(/"/g,  '&quot;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;');
}
window.escHtml = escHtml;

// Sanitize user text before storing
function sanitize(str) {
  return (str || '')
    .replace(/[*_~`]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

// Phone validation — single authoritative copy
function validatePhone(val) {
  if (!val) return false;
  var digits = val.replace(/[\s\-]/g, '').replace(/^\+?975/, '');
  return /^(17|77|16|02|07|03|72|75|74|73)\d{6}$/.test(digits);
}
window.validatePhone = validatePhone;

//validate email
function validateEmail(val) {
  if (!val) return true; // optional field — allow empty
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}
window.validateEmail = validateEmail;

function showErr(id, show) {
  var el = document.getElementById(id);
  if (el) el.classList[show ? 'add' : 'remove']('show');
}

function getInitials(name) {
  return (name || 'A')
    .split(' ')
    .map(function(w) { return w[0]; })
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ==========================================================
   TOAST
   ========================================================== */
function showToast(msg, duration) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, duration || 2500);
}
window.showToast = showToast;

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
   FAQ ACCORDION
   ========================================================== */
function toggleFaq(el) {
  el.classList.toggle('open');
}
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
  var dlAmt      = isNaN(dlcharge) ? 0 : dlcharge;
  var total      = Math.round(price + serviceFee + shipping + dlAmt);

  document.getElementById('estBase').textContent          = '₹ ' + Math.round(price).toLocaleString('en-IN');
  document.getElementById('estServiceCharge').textContent = '₹ ' + serviceFee.toLocaleString('en-IN');
  document.getElementById('estShipping').textContent      = '~₹ ' + shipping.toLocaleString('en-IN');
  document.getElementById('dchargeDisplay').textContent   = '₹ ' + Math.round(dlAmt).toLocaleString('en-IN');
  document.getElementById('estTotal').textContent         = '₹ ' + total.toLocaleString('en-IN');
}
window.calcEstimate = calcEstimate;

/* ==========================================================
   FILE UPLOAD DISPLAY
   ========================================================== */
var _objectUrls = [];

function handleFileSelect(input) {
  var list  = document.getElementById('fileList');
  var errEl = document.getElementById('err-files'); // element now exists in HTML

  _objectUrls.forEach(function(u) { URL.revokeObjectURL(u); });
  _objectUrls = [];
  list.innerHTML = '';
  if (errEl) errEl.classList.remove('show');

  var MAX   = 5 * 1024 * 1024;
  var valid = true;

  Array.from(input.files).forEach(function(f) {
    if (f.size > MAX) {
      if (errEl) {
        errEl.textContent = f.name + ' exceeds 5 MB limit.';
        errEl.classList.add('show');
      }
      valid = false;
      return;
    }

    var chip = document.createElement('div');
    chip.className = 'file-chip';

    if (f.type.startsWith('image/')) {
      var objUrl = URL.createObjectURL(f);
      _objectUrls.push(objUrl);
      var img = document.createElement('img');
      img.src = objUrl;
      img.alt = f.name;
      img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;';
      chip.appendChild(img);
    }

    var nameSpan = document.createElement('span');
    nameSpan.textContent = f.name;
    chip.appendChild(nameSpan);
    list.appendChild(chip);
  });

  if (!valid) {
    _objectUrls.forEach(function(u) { URL.revokeObjectURL(u); });
    _objectUrls = [];
    input.value = '';
  }
}
window.handleFileSelect = handleFileSelect;

/* ==========================================================
   PRODUCT ROWS
   ========================================================== */
var MAX_PRODUCTS = 10;

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
    '<div class="product-notes-wrap">',
      '<input type="text" name="product_notes" placeholder="Size, colour, variant… (optional)" style="margin-top:8px;">',
    '</div>',
    '<div class="url-warning"><i class="fa-solid fa-triangle-exclamation"></i> <span>Double-check this link — it doesn\'t look like a supported store URL.</span></div>',
    '<div class="product-preview"></div>',
  ].join('');
  return row;
}

function addProductRow() {
  var container = document.getElementById('productsContainer');
  var rows = container.querySelectorAll('.product-row');
  if (rows.length >= MAX_PRODUCTS) {
    showToast('Maximum ' + MAX_PRODUCTS + ' products per order. Place a second order for more.', 3500);
    return;
  }
  container.appendChild(buildProductRow());
}

function removeProduct(btn) {
  // FIX: scope to productsContainer only, not whole document
  var container = document.getElementById('productsContainer');
  var rows = container.querySelectorAll('.product-row');
  if (rows.length > 1) btn.closest('.product-row').remove();
}

window.addProductRow = addProductRow;
window.removeProduct = removeProduct;

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
   Uses Microlink as primary with URL-slug fallback.
   No customer URLs sent to unknown third-party proxies.
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

  var done = false;

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

  fetch(
    'https://api.microlink.io/?url=' + encodeURIComponent(url) +
    '&palette=false&audio=false&video=false&iframe=false'
  )
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (done) return;
      if (data.status !== 'success') { showFallback(); return; }
      done = true;
      var d     = data.data;
      var title = (d.title || '').replace(/\s*[-|–]\s*(Amazon|Flipkart|Myntra|Meesho).*/i, '').trim();
      if (title.length > 100) title = title.slice(0, 100) + '…';
      renderPreview(
        preview,
        title || brandFallback + ' product',
        (d.image && d.image.url) || '',
        d.publisher || brandFallback
      );
    })
    .catch(showFallback);

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

/* ==========================================================
   MULTI-STEP FORM STATE
   ========================================================== */
var currentStep         = 1;
var selectedCity        = '';
var selectedDeliveryFee = 0;
var selectedPaymentMethod = '';

window.currentStep           = currentStep;
window.selectedCity          = selectedCity;
window.selectedDeliveryFee   = selectedDeliveryFee;
window.selectedPaymentMethod = selectedPaymentMethod;

/* ==========================================================
   PAYMENT SELECTION — FIX: was missing entirely
   ========================================================== */
function selectPayment(method, el) {
  selectedPaymentMethod = method;
  window.selectedPaymentMethod = method;
  document.getElementById('paymentMethod').value = method;
  document.querySelectorAll('.payment-card').forEach(function(c) { c.classList.remove('selected'); });
  el.classList.add('selected');
  showErr('err-payment', false);
}
window.selectPayment = selectPayment;

/* ==========================================================
   CITY SELECTION
   ========================================================== */
function selectCity(city, fee, el) {
  selectedCity        = city;
  selectedDeliveryFee = fee;
  window.selectedCity          = city;
  window.selectedDeliveryFee   = fee;
  document.getElementById('deliveryCity').value = city;
  document.querySelectorAll('.city-card').forEach(function(c) { c.classList.remove('selected'); });
  el.classList.add('selected');
  showErr('err-city', false);
}
window.selectCity = selectCity;

/* ==========================================================
   STEP VALIDATION
   ========================================================== */
function setValid(el, condition, errId) {
  var errEl = document.getElementById(errId);
  if (!condition) {
    el.classList.add('field-error');
    if (errEl) errEl.classList.add('show');
    return false;
  } else {
    el.classList.remove('field-error');
    if (errEl) errEl.classList.remove('show');
    return true;
  }
}

function validateStep(step) {
  var ok = true;

  if (step === 1) {
    var name  = document.getElementById('fullName');
    var phone = document.getElementById('whatsapp');
    var email = document.getElementById('email'); // new email field
    ok = setValid(name,  name.value.trim().length >= 2,    'err-name')  && ok;
    ok = setValid(phone, validatePhone(phone.value),         'err-phone') && ok;
    ok = setValid(email, validateEmail(email.value),        'err-email') && ok;
  }

  if (step === 2) {
    if (!selectedCity) {
      showErr('err-city', true);
      ok = false;
    } else {
      showErr('err-city', false);
    }
    var addr = document.getElementById('address');
    ok = setValid(addr, addr.value.trim().length >= 5, 'err-address') && ok;
  }

  if (step === 3) {
    var linkInputs = document.querySelectorAll('input[name="product_links"]');
    var hasProduct = false;
    linkInputs.forEach(function(input) {
      if (input.value.trim().length > 8) hasProduct = true;
    });
    if (!hasProduct) {
      showToast('Please add at least one product link.', 3000);
      ok = false;
    }
  }

  if (step === 4) {
    if (!selectedPaymentMethod) {
      showErr('err-payment', true);
      ok = false;
    } else {
      showErr('err-payment', false);
    }
  }

  return ok;
}
window.validateStep = validateStep;

/* ==========================================================
   GO TO STEP — FIX: progress bar now loops to 5 (was 4)
   ========================================================== */
function goStep(target) {
  if (target > currentStep && !validateStep(currentStep)) return;

  document.querySelectorAll('.step-panel').forEach(function(panel) {
    panel.classList.remove('active', 'step-reverse');
  });

  var nextPanel = document.getElementById('step-' + target);
  nextPanel.classList.add('active');
  if (target < currentStep) nextPanel.classList.add('step-reverse');

  // FIX: loop to 5, not 4
  for (var i = 1; i <= 5; i++) {
    var stepItem = document.getElementById('si-' + i);
    if (!stepItem) continue;
    stepItem.classList.remove('active', 'completed');
    if (i < target)  stepItem.classList.add('completed');
    if (i === target) stepItem.classList.add('active');
  }

  // FIX: buildReview triggered at step 5 (was 4)
  if (target === 5) buildReview();

  currentStep = target;
  window.currentStep = target;
  document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' });
}
window.goStep = goStep;

/* ==========================================================
   BUILD REVIEW — FIX: now populates reviewPaymentMethod too
   ========================================================== */
function buildReview() {
  var grid    = document.getElementById('reviewGrid');
  var name    = document.getElementById('fullName').value.trim();
  var phone   = document.getElementById('whatsapp').value.trim();
  var address = document.getElementById('address').value.trim();

  var productRows = document.querySelectorAll('.product-row');
  var productHtml = '';

  productRows.forEach(function(row, index) {
    var linkInput  = row.querySelector('input[name="product_links"]');
    var qtyInput   = row.querySelector('input[name="quantities"]');
    var notesInput = row.querySelector('input[name="product_notes"]');

    var link  = linkInput  ? linkInput.value.trim()  : '';
    var qty   = qtyInput   ? qtyInput.value           : '1';
    var notes = notesInput ? notesInput.value.trim()  : '';

    if (link) {
      productHtml += [
        '<div style="margin-bottom:8px;padding:6px 0;border-bottom:1px solid #eee;">',
          '<strong>Item ' + (index + 1) + ':</strong> ' + escHtml(link),
          ' <span style="color:var(--primary)">× ' + escHtml(qty) + '</span>',
          notes ? ' <span style="color:#888;font-size:0.88em">(' + escHtml(notes) + ')</span>' : '',
        '</div>',
      ].join('');
    }
  });

  var fileCount = document.getElementById('fileList').children.length || 0;

  grid.innerHTML = [
    '<div class="review-block">',
      '<div class="review-block-icon"><i class="fa-solid fa-user"></i></div>',
      '<div class="review-block-info">',
        '<div class="review-block-title">Contact</div>',
        '<div class="review-block-val">' + escHtml(name || '—') + '</div>',
        '<div class="review-block-sub">+975 ' + escHtml(phone || '—') + '</div>',
      '</div>',
      '<button class="review-edit-btn" onclick="goStep(1)">Edit</button>',
    '</div>',

    '<div class="review-block">',
      '<div class="review-block-icon"><i class="fa-solid fa-location-dot"></i></div>',
      '<div class="review-block-info">',
        '<div class="review-block-title">Delivery</div>',
        '<div class="review-block-val">' + escHtml(selectedCity || '—') + '</div>',
        '<div class="review-block-sub">' + escHtml(address || '—') + '</div>',
      '</div>',
      '<button class="review-edit-btn" onclick="goStep(2)">Edit</button>',
    '</div>',

    '<div class="review-block">',
      '<div class="review-block-icon"><i class="fa-solid fa-box-open"></i></div>',
      '<div class="review-block-info">',
        '<div class="review-block-title">Products</div>',
        '<div class="review-block-val" style="font-weight:400;">' + (productHtml || '<em>No products added yet</em>') + '</div>',
      '</div>',
      '<button class="review-edit-btn" onclick="goStep(3)">Edit</button>',
    '</div>',

    '<div class="review-block">',
      '<div class="review-block-icon"><i class="fa-solid fa-credit-card"></i></div>',
      '<div class="review-block-info">',
        '<div class="review-block-title">Payment</div>',
        '<div class="review-block-val">' + escHtml(selectedPaymentMethod || '—') + '</div>',
      '</div>',
      '<button class="review-edit-btn" onclick="goStep(4)">Edit</button>',
    '</div>',

    fileCount > 0 ? [
      '<div class="review-block">',
        '<div class="review-block-icon"><i class="fa-solid fa-images"></i></div>',
        '<div class="review-block-info">',
          '<div class="review-block-title">Screenshots</div>',
          '<div class="review-block-val">' + fileCount + ' file' + (fileCount > 1 ? 's' : '') + ' uploaded</div>',
        '</div>',
      '</div>',
    ].join('') : '',
  ].join('');

  // FIX: populate reviewDeliveryFee and reviewPaymentMethod
  var feeEl = document.getElementById('reviewDeliveryFee');
  if (feeEl) feeEl.textContent = selectedDeliveryFee ? '₹' + selectedDeliveryFee : '—';

  var pmEl = document.getElementById('reviewPaymentMethod');
  if (pmEl) pmEl.textContent = selectedPaymentMethod || '—';
}
window.buildReview = buildReview;

/* ==========================================================
   CLEAR FORM — single authoritative definition
   ========================================================== */
function clearForm() {
  document.getElementById('orderForm').reset();
  document.getElementById('fileList').innerHTML = '';
  _objectUrls.forEach(function(u) { URL.revokeObjectURL(u); });
  _objectUrls = [];
  document.getElementById('productsContainer').innerHTML = '';
  addProductRow();
  document.querySelectorAll('.field-error-msg').forEach(function(el) { el.classList.remove('show'); });
  document.querySelectorAll('.product-preview').forEach(function(el) { el.style.display = 'none'; });
  document.querySelectorAll('input, textarea').forEach(function(el) { el.classList.remove('field-error'); });
  document.querySelectorAll('.city-card').forEach(function(c) { c.classList.remove('selected'); });
  document.querySelectorAll('.payment-card').forEach(function(c) { c.classList.remove('selected'); });
  selectedCity          = '';
  selectedDeliveryFee   = 0;
  selectedPaymentMethod = '';
  window.selectedCity          = '';
  window.selectedDeliveryFee   = 0;
  window.selectedPaymentMethod = '';
  goStep(1);
}
window.clearForm = clearForm;

/* ==========================================================
   ORDER ID GENERATION
   ========================================================== */
function generateOrderId() {
  var now    = new Date();
  var year   = String(now.getFullYear()).slice(2);
  var month  = String(now.getMonth() + 1).padStart(2, '0');
  var day    = String(now.getDate()).padStart(2, '0');
  var suffix = Math.random().toString(36).toUpperCase().slice(2, 8);
  return 'S2B-' + year + month + day + '-' + suffix;
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
   ========================================================== */
async function uploadFile(file, orderId) {
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
   FIX: quantities stored as integers (not strings)
   FIX: screenshot_urls stored as array (not joined string)
   ========================================================== */
/* ==========================================================
   FORM SUBMISSION — FIXED EMAIL HANDLING
   ========================================================== */
var form      = document.getElementById('orderForm');
var submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async function(e) {
  e.preventDefault();

  const nameVal   = sanitize(document.getElementById('fullName').value.trim());
  const phoneVal  = sanitize(document.getElementById('whatsapp').value.trim());
  const emailVal  = sanitize(document.getElementById('email').value.trim());

  console.log('🔍 Email Debug:', { raw: document.getElementById('email').value, sanitized: emailVal });

  const cityVal       = sanitize(document.getElementById('deliveryCity').value);
  const addressVal    = sanitize(document.getElementById('address').value);
  const paymentMethod = document.getElementById('paymentMethod').value || ''; // SUBMIT INTO PAYMENTS TABLE

  const linkInputs = form.querySelectorAll('input[name="product_links"]'); //Product lInk
  const qtyInputs  = form.querySelectorAll('input[name="quantities"]');
  const links = [];
  const qtys  = [];

  linkInputs.forEach(function(inp, i) {
    const link = inp.value.trim();
    if (link) {
      links.push(link);
      qtys.push(parseInt(qtyInputs[i] ? (qtyInputs[i].value || '1') : '1', 10) || 1);
    }
  });

  // === VALIDATION ===
  let hasError = false;
  showErr('err-name',    !nameVal);
  showErr('err-phone',   !validatePhone(phoneVal));
  showErr('err-email',   !validateEmail(emailVal));
  showErr('err-city',    !cityVal);
  showErr('err-address', !addressVal);
  showErr('err-payment', !paymentMethod);

  if (!nameVal || !validatePhone(phoneVal) || !validateEmail(emailVal) || 
      !cityVal || !addressVal || !paymentMethod) {
    hasError = true;
  }

  if (links.length === 0) {
    showToast('Please add at least one product link.');
    hasError = true;
  }

  if (hasError) return;

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Submitting…';

  const orderId      = generateOrderId();
  const fileInput    = document.getElementById('fileInput');
  const uploadedUrls = [];

  // Upload files if any
  if (fileInput && fileInput.files.length > 0) {
    for (const file of fileInput.files) {
      try {
        const url = await uploadFile(file, orderId);
        uploadedUrls.push(url);
      } catch (err) {
        console.error('File upload failed for', file.name, err);
        showToast('⚠️ Could not upload ' + file.name + ' — continuing.', 4000);
      }
    }
  }

try {
    // ==================== USER CREATION / LOOKUP ====================
    let { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('whatsapp', phoneVal)
      .maybeSingle();

    if (userErr) throw userErr;

    // If not found by whatsapp, try by email
    if (!user && emailVal) {
      const { data: userByEmail, error: emailErr } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('email', emailVal)
        .maybeSingle();

      if (emailErr) throw emailErr;
      if (userByEmail) user = userByEmail;
    }

    // Create new user if not found by either
    if (!user) {
      const { data: newUser, error: insertErr } = await supabase
        .from('users')
        .insert([{
          full_name: nameVal,
          whatsapp: phoneVal,
          email: emailVal || null,
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;
      user = newUser;
    }
    // Update email if user exists but has no email yet
    else if ((!user.email || user.email === '') && emailVal) {
      await supabase
        .from('users')
        .update({ email: emailVal })
        .eq('id', user.id);
    }

    // ==================== INSERT ORDER INTO ORDERS TABLE ====================
    const { data: orderInsertData, error: orderError } = await supabase.from('orders').insert([{
      order_id: orderId,
      user_id: user.id,
      delivery_city: cityVal,
      delivery_address: addressVal,
      product_links: links,
      quantities: qtys,
      screenshot_url: uploadedUrls,
      order_status: 'pending',
      total_amount: 0
    }]).select();  // ← ADD .select() to get the inserted row back

        console.log('=== DEBUG ===');
    console.log('orderInsertData:', orderInsertData);
    console.log('orderInsertData[0]:', orderInsertData?.[0]);
    console.log('orderInsertData[0].id:', orderInsertData?.[0]?.id);
    console.log('orderInsertData[0].order_id:', orderInsertData?.[0]?.order_id);
    console.log('=== END DEBUG ===');

    if (orderError) throw orderError;

    const orderUuid = orderInsertData[0].id;  // ← GET the uuid

     // ==================== INSERT PAYMENT (initial) ====================
    const { error: paymentError } = await supabase.from('payments').insert([{
      order_id: orderId,              // ← FIXED: use text orderId, not uuid
      user_id: user.id,
      product_price: 0,
      shipping_fee: 0,
      service_fee: 0,
      delivery_fee: selectedDeliveryFee || 0,
      total_amount: selectedDeliveryFee || 0,
      payment_method: paymentMethod,
      status: 'pending',
      created_at: new Date().toISOString()
    }]);

    if (paymentError) throw paymentError;


    // ==================== WHATSAPP MESSAGE ====================
    const productsText = links.map(function(link, i) {
      return '  ' + (i + 1) + '. ' + link + ' (Qty: ' + (qtys[i] || 1) + ')';
    }).join('\n');

    const fileCount = fileInput ? fileInput.files.length : 0;
    const screenshotNote = fileCount > 0 
      ? '\n\n📎 Screenshots: ' + fileCount + ' file' + (fileCount > 1 ? 's' : '') + ' uploaded.' 
      : '';

const message = 
  'Hello Shop2Bhutan,\n\n' +
  '🆔 Order ID: ' + orderId + '\n\n' +
  '👤 Name: ' + nameVal + '\n' +
  '📱 WhatsApp: ' + phoneVal + '\n' +
  '✉️ Email: ' + (emailVal || 'Not provided') + '\n' +
  '🏙️ City: ' + cityVal + '\n' +
  '💳 Payment: ' + paymentMethod + '\n' +
  '📍 Address: ' + addressVal + '\n\n' +
  '🛒 Products:\n' + productsText + screenshotNote +
  
  '\n\n👉 Please go to https://shop2bt.vercel.app/track.html to track your order using the Order ID.';

    document.getElementById('whatsappConfirmBtn').href =
      'https://wa.me/97577113302?text=' + encodeURIComponent(message);

    document.getElementById('popupOrderId').textContent = orderId;
    document.getElementById('successPopup').classList.add('open');

  } catch (err) {
    console.error('FULL SUBMISSION ERROR:', err);
    showToast('❌ Failed to submit order: ' + (err.message || 'Unknown error'), 5000);
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
  clearForm(); // ← add this
}
window.closePopup = closePopup;

/* ==========================================================
   REVIEW MODAL
   ========================================================== */
function openReviewForm() {
  document.getElementById('reviewModal').classList.add('open');
}

function closeReviewForm() {
  document.getElementById('reviewModal').classList.remove('open');
  document.getElementById('reviewName').value     = '';
  document.getElementById('reviewLocation').value = '';
  document.getElementById('reviewRating').value   = '5';
  document.getElementById('reviewText').value     = '';
  document.getElementById('reviewOrderId').value  = '';
}

window.openReviewForm  = openReviewForm;
window.closeReviewForm = closeReviewForm;

/* ==========================================================
   SUBMIT REVIEW
   is_verified_buyer verified server-side via Supabase lookup.
   ========================================================== */
async function submitReview() {
  const name     = document.getElementById('reviewName').value.trim();
  const location = document.getElementById('reviewLocation').value.trim();
  const rating   = document.getElementById('reviewRating').value;
  const message  = document.getElementById('reviewText').value.trim();
  const orderId  = document.getElementById('reviewOrderId').value.trim();

  if (!name || !message) {
    showToast('Please fill in your name and review.');
    return;
  }

  const btn = document.getElementById('reviewSubmitBtn');
  btn.disabled    = true;
  btn.textContent = 'Submitting…';

  try {
    let isVerified = false;
    if (orderId) {
      const { data: orderCheck, error: checkErr } = await supabase
        .from('orders')
        .select('order_id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (!checkErr && orderCheck) isVerified = true;
    }

    const { error } = await supabase
      .from('reviews')
      .insert([{
        full_name:         name,
        city:              location || 'Bhutan',
        rating:            parseInt(rating),
        message:           message,
        order_id:          orderId || null,
        is_verified_buyer: isVerified,
        is_approved:       false,
      }]);

    if (error) throw error;

    showToast('Review submitted! It will appear after approval.');
    closeReviewForm();

  } catch (err) {
    console.error('FULL REVIEW ERROR:', err);
    showToast('Failed to submit review: ' + (err.message || 'unknown error'));
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Submit Review';
  }
}
window.submitReview = submitReview;

/* ==========================================================
   LOAD REVIEWS
   ========================================================== */
function loadReviews() {
  const grid = document.getElementById('testiGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="testi-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading reviews…</div>';

  supabase
    .from('reviews')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(6)
    .then(function({ data, error }) {
      if (error) {
        console.error(error);
        grid.innerHTML = '<p style="color:var(--muted);text-align:center;">Unable to load reviews right now.</p>';
        return;
      }

      if (!data || data.length === 0) {
        grid.innerHTML = '<p style="color:var(--muted);text-align:center;">No reviews yet — be the first!</p>';
        return;
      }

      grid.innerHTML = data.map(function(r) {
        return [
          '<div class="testi-card">',
            '<div class="testi-stars">',
              '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating),
            '</div>',
            '<p class="testi-text">' + escHtml(r.message) + '</p>',
            '<div class="testi-author">',
              '<div class="testi-avatar">' + getInitials(r.full_name) + '</div>',
              '<div>',
                '<div class="testi-name">',
                  escHtml(r.full_name),
                  r.is_verified_buyer
                    ? ' <span class="verified-badge"><i class="fa-solid fa-circle-check"></i> Verified Buyer</span>'
                    : '',
                '</div>',
                '<div class="testi-location">' + escHtml(r.city || 'Bhutan') + '</div>',
              '</div>',
            '</div>',
          '</div>',
        ].join('');
      }).join('');
    });
}
window.loadReviews = loadReviews;

/* ==========================================================
   INIT
   ========================================================== */
document.addEventListener('DOMContentLoaded', function() {
  addProductRow();
  loadReviews();
});

