// ==========================================================
//  Shop2Bhutan — main.js v3 (UX Enhanced)
//  ---------------------------------------------------------
//  Backend logic 100% preserved. UX layer completely rebuilt:
//  • Cart-first product flow with visual previews
//  • Sticky order summary with live estimates
//  • Auto-save to localStorage (never lose progress)
//  • Smooth step transitions & micro-interactions
//  • Drag & drop file uploads
//  • Mobile-optimized floating summary
// ==========================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://deecrnfbvgbzyybqhywy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8"
);

/* ==========================================================
   DESIGN TOKENS & HELPERS
   ========================================================== */
const SHIPPING_ESTIMATE = 100;
const MAX_PRODUCTS = 10;
const STORAGE_KEY = 's2b_order_draft';

function escHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
window.escHtml = escHtml;

function sanitize(str) {
  return (str || '')
    .replace(/[*_~`]/g, '')
    .replace(/[-]/g, '')
    .trim();
}

function validatePhone(val) {
  if (!val) return false;
  const digits = val.replace(/[\s\-]/g, '').replace(/^\+?975/, '');
  return /^(17|77|16|02|07|03|72|75|74|73)\d{6}$/.test(digits);
}
window.validatePhone = validatePhone;

function validateEmail(val) {
  if (!val) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}
window.validateEmail = validateEmail;

function showErr(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList[show ? 'add' : 'remove']('show');
}
window.showErr = showErr;

function getInitials(name) {
  return (name || 'A')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  t.innerHTML = '<i class="fa-solid fa-circle-info"></i> ' + msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
window.showToast = showToast;

/* ==========================================================
   NAV SCROLL EFFECT
   ========================================================== */
const mainNav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) mainNav.classList.add('scrolled');
  else mainNav.classList.remove('scrolled');
});

/* ==========================================================
   HAMBURGER
   ========================================================== */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', (e) => {
  e.stopPropagation();
  mobileMenu.classList.toggle('open');
});
document.querySelectorAll('.mobile-menu .nav-btn').forEach(btn => {
  btn.addEventListener('click', () => mobileMenu.classList.remove('open'));
});
document.addEventListener('click', (e) => {
  if (!mainNav.contains(e.target)) mobileMenu.classList.remove('open');
});

/* ==========================================================
   FAQ ACCORDION
   ========================================================== */
function toggleFaq(el) {
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('open'));
  if (!wasOpen) el.classList.add('open');
}
window.toggleFaq = toggleFaq;

/* ==========================================================
   FEE ESTIMATOR
   ========================================================== */
function calcEstimate() {
  const price = parseFloat(document.getElementById('estPrice').value);
  const dlcharge = parseFloat(document.getElementById('dcharge').value);

  if (isNaN(price) || price <= 0) {
    document.getElementById('estBase').textContent = '₹ —';
    document.getElementById('estServiceCharge').textContent = '₹ —';
    document.getElementById('estShipping').textContent = '₹ —';
    document.getElementById('dchargeDisplay').textContent = '₹ —';
    document.getElementById('estTotal').textContent = '₹ —';
    return;
  }

  const rate = price < 2000 ? 0.15 : price <= 5999 ? 0.10 : 0.08;
  const serviceFee = Math.round(price * rate);
  const shipping = SHIPPING_ESTIMATE;
  const dlAmt = isNaN(dlcharge) ? 0 : dlcharge;
  const total = Math.round(price + serviceFee + shipping + dlAmt);

  document.getElementById('estBase').textContent = '₹ ' + Math.round(price).toLocaleString('en-IN');
  document.getElementById('estServiceCharge').textContent = '₹ ' + serviceFee.toLocaleString('en-IN');
  document.getElementById('estShipping').textContent = '~₹ ' + shipping.toLocaleString('en-IN');
  document.getElementById('dchargeDisplay').textContent = '₹ ' + Math.round(dlAmt).toLocaleString('en-IN');
  document.getElementById('estTotal').textContent = '₹ ' + total.toLocaleString('en-IN');
}
window.calcEstimate = calcEstimate;

/* ==========================================================
   FILE UPLOAD DISPLAY + DRAG & DROP
   ========================================================== */
let _objectUrls = [];

function handleFileSelect(input) {
  const list = document.getElementById('fileList');
  const errEl = document.getElementById('err-files');

  _objectUrls.forEach(u => URL.revokeObjectURL(u));
  _objectUrls = [];
  list.innerHTML = '';
  if (errEl) errEl.classList.remove('show');

  const MAX = 5 * 1024 * 1024;
  let valid = true;

  Array.from(input.files).forEach(f => {
    if (f.size > MAX) {
      if (errEl) {
        errEl.textContent = f.name + ' exceeds 5 MB limit.';
        errEl.classList.add('show');
      }
      valid = false;
      return;
    }
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    if (f.type.startsWith('image/')) {
      const objUrl = URL.createObjectURL(f);
      _objectUrls.push(objUrl);
      const img = document.createElement('img');
      img.src = objUrl;
      img.alt = f.name;
      chip.appendChild(img);
    }
    const nameSpan = document.createElement('span');
    nameSpan.textContent = f.name;
    chip.appendChild(nameSpan);
    list.appendChild(chip);
  });

  if (!valid) {
    _objectUrls.forEach(u => URL.revokeObjectURL(u));
    _objectUrls = [];
    input.value = '';
  }
  saveFormState();
}
window.handleFileSelect = handleFileSelect;

// Drag & drop
const dropZone = document.getElementById('dropZone');
if (dropZone) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });
  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, () => dropZone.classList.add('drag-over'), false);
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-over'), false);
  });
  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    const input = document.getElementById('fileInput');
    input.files = files;
    handleFileSelect(input);
  }, false);
}

/* ==========================================================
   PRODUCT ROWS — CART STYLE
   ========================================================== */
function buildProductRow(data = {}) {
  const row = document.createElement('div');
  row.className = 'product-row';
  row.innerHTML = `
    <div class="product-row-main">
      <div class="product-preview-area">
        <div class="preview-placeholder"><i class="fa-solid fa-link"></i></div>
        <div class="preview-content">
          <img src="" alt="Product" onerror="this.style.display='none'">
        </div>
      </div>
      <div class="product-fields">
        <input type="text" name="product_links" class="input-field" placeholder="Paste Amazon / Flipkart / Myntra / Meesho link" value="${escHtml(data.link || '')}" oninput="onLinkInput(this); saveFormState();">
        <div class="url-warning"><i class="fa-solid fa-triangle-exclamation"></i> <span>Double-check this link — it doesn't look like a supported store URL.</span></div>
        <div class="product-meta-fields">
          <div class="qty-field">
            <label>Qty</label>
            <div class="stepper">
              <button type="button" onclick="adjustQty(this, -1)">−</button>
              <input type="number" name="quantities" value="${data.qty || 1}" min="1" aria-label="Quantity" readonly>
              <button type="button" onclick="adjustQty(this, 1)">+</button>
            </div>
          </div>
          <input type="text" name="product_notes" class="input-field" placeholder="Size, colour, variant… (optional)" value="${escHtml(data.notes || '')}" onchange="saveFormState()">
        </div>
        <div class="product-preview"></div>
      </div>
      <button type="button" class="remove-btn" onclick="removeProduct(this)" title="Remove" aria-label="Remove product">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;
  // Trigger preview if link exists
  if (data.link) {
    setTimeout(() => {
      const input = row.querySelector('input[name="product_links"]');
      if (input) onLinkInput(input);
    }, 100);
  }
  return row;
}

function addProductRow(data) {
  const container = document.getElementById('productsContainer');
  const rows = container.querySelectorAll('.product-row');
  if (rows.length >= MAX_PRODUCTS) {
    showToast('Maximum ' + MAX_PRODUCTS + ' products per order. Place a second order for more.', 3500);
    return;
  }
  container.appendChild(buildProductRow(data));
  updateOrderSummary();
  saveFormState();
}
window.addProductRow = addProductRow;

function removeProduct(btn) {
  const container = document.getElementById('productsContainer');
  const rows = container.querySelectorAll('.product-row');
  if (rows.length > 1) {
    btn.closest('.product-row').remove();
    updateOrderSummary();
    saveFormState();
  } else {
    showToast('You need at least one product row. Clear the link instead.', 2500);
  }
}
window.removeProduct = removeProduct;

function adjustQty(btn, delta) {
  const input = btn.parentElement.querySelector('input[name="quantities"]');
  let val = parseInt(input.value, 10) || 1;
  val = Math.max(1, val + delta);
  input.value = val;
  updateOrderSummary();
  saveFormState();
}
window.adjustQty = adjustQty;

/* ==========================================================
   URL VALIDATION & PREVIEW
   ========================================================== */
const SUPPORTED = ['amazon.in', 'flipkart.com', 'myntra.com', 'meesho.com'];
function isSupported(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return SUPPORTED.some(s => host === s || host.endsWith('.' + s));
  } catch (e) { return false; }
}

const debounceMap = {};
function onLinkInput(input) {
  const row = input.closest('.product-row');
  const warn = row.querySelector('.url-warning');
  const preview = row.querySelector('.product-preview');
  const previewArea = row.querySelector('.product-preview-area');
  const previewContent = row.querySelector('.preview-content');
  const previewPlaceholder = row.querySelector('.preview-placeholder');
  const val = input.value.trim();

  if (val.startsWith('http') && !isSupported(val)) {
    warn.classList.add('show');
  } else {
    warn.classList.remove('show');
  }

  const id = input._previewId || (input._previewId = Math.random().toString(36).slice(2));
  clearTimeout(debounceMap[id]);

  if (!val.startsWith('http')) {
    preview.style.display = 'none';
    previewPlaceholder.style.display = 'grid';
    previewContent.style.display = 'none';
    updateOrderSummary();
    return;
  }

  preview.style.display = 'block';
  preview.innerHTML = '<div class="preview-status"><div class="preview-spinner"></div> Fetching preview…</div>';

  debounceMap[id] = setTimeout(() => fetchPreview(input, val), 900);
  updateOrderSummary();
}
window.onLinkInput = onLinkInput;

function fetchPreview(input, url) {
  const row = input.closest('.product-row');
  const preview = row.querySelector('.product-preview');
  const previewArea = row.querySelector('.product-preview-area');
  const previewContent = row.querySelector('.preview-content');
  const previewImg = previewContent.querySelector('img');
  const previewPlaceholder = row.querySelector('.preview-placeholder');

  if (input.value.trim() !== url) return;

  let brandFallback = 'Product';
  try {
    const host = new URL(url).hostname.replace('www.', '');
    const brand = host.split('.')[0];
    brandFallback = brand.charAt(0).toUpperCase() + brand.slice(1);
  } catch (e) {}

  let done = false;
  function showFallback() {
    if (done) return;
    done = true;
    let slug = '';
    try {
      slug = decodeURIComponent(new URL(url).pathname)
        .split('/').filter(Boolean)
        .find(s => s.length > 8 && !/^[0-9]+$/.test(s)) || '';
      slug = slug.replace(/[-_]/g, ' ').replace(/\w/g, c => c.toUpperCase());
      if (slug.length > 80) slug = slug.slice(0, 80) + '…';
    } catch (e) {}
    renderPreview(preview, slug || brandFallback + ' product', '', brandFallback, true);
    // Update thumbnail
    previewPlaceholder.style.display = 'none';
    previewContent.style.display = 'none';
    updateOrderSummary();
  }

  fetch(
    'https://api.microlink.io/?url=' + encodeURIComponent(url) +
    '&palette=false&audio=false&video=false&iframe=false'
  )
    .then(r => r.json())
    .then(data => {
      if (done) return;
      if (data.status !== 'success') { showFallback(); return; }
      done = true;
      const d = data.data;
      let title = (d.title || '').replace(/\s*[-|–]\s*(Amazon|Flipkart|Myntra|Meesho).*/i, '').trim();
      if (title.length > 100) title = title.slice(0, 100) + '…';
      renderPreview(preview, title || brandFallback + ' product', (d.image && d.image.url) || '', d.publisher || brandFallback);
      // Update thumbnail
      if (d.image && d.image.url) {
        previewImg.src = d.image.url;
        previewImg.style.display = 'block';
        previewPlaceholder.style.display = 'none';
        previewContent.style.display = 'block';
      } else {
        previewPlaceholder.style.display = 'grid';
        previewContent.style.display = 'none';
      }
      updateOrderSummary();
    })
    .catch(showFallback);

  setTimeout(showFallback, 6000);
}

function renderPreview(preview, title, imgUrl, source, isFallback) {
  const row = preview.closest('.product-row');
  const input = row.querySelector('input[name="product_links"]');
  if (input && input.value.trim() === '') {
    preview.style.display = 'none';
    return;
  }
  preview.style.display = 'block';

  const imgHtml = imgUrl
    ? '<img class="preview-img" src="' + escHtml(imgUrl) + '" alt="Product" onerror="this.style.display=\'none\'">'
    : '';
  const fallbackNote = isFallback
    ? '<div style="font-size:0.78rem;color:#f97316;margin-top:4px;"><i class="fa-solid fa-circle-info"></i> Preview unavailable — link saved.</div>'
    : '';

  preview.innerHTML = `
    <div class="preview-inner">
      ${imgHtml}
      <div class="preview-info">
        <div class="preview-title"></div>
        <div class="preview-source"></div>
        ${fallbackNote}
      </div>
    </div>
  `;
  preview.querySelector('.preview-title').textContent = title;
  preview.querySelector('.preview-source').textContent = source;
}

/* ==========================================================
   ORDER SUMMARY SIDEBAR
   ========================================================== */
function updateOrderSummary() {
  const container = document.getElementById('productsContainer');
  const rows = container.querySelectorAll('.product-row');
  const summaryItems = document.getElementById('summaryItems');
  const summaryItemCount = document.getElementById('summaryItemCount');
  const summaryDelivery = document.getElementById('summaryDelivery');
  const summaryService = document.getElementById('summaryService');
  const summaryTotal = document.getElementById('summaryTotal');
  const summaryToggleTotal = document.getElementById('summaryToggleTotal');

  let itemsHtml = '';
  let itemCount = 0;
  let totalProductPrice = 0;

  rows.forEach((row, idx) => {
    const linkInput = row.querySelector('input[name="product_links"]');
    const qtyInput = row.querySelector('input[name="quantities"]');
    const previewImg = row.querySelector('.preview-content img');
    const link = linkInput ? linkInput.value.trim() : '';
    const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;

    if (link) {
      itemCount += qty;
      // Try to extract price from link (rough heuristic for display)
      const priceMatch = link.match(/[?&]price=(\d+)/) || link.match(/\/(\d{3,})\//);
      const estPrice = priceMatch ? parseInt(priceMatch[1], 10) : 0;
      totalProductPrice += estPrice * qty;

      let thumbHtml = '<i class="fa-solid fa-link"></i>';
      if (previewImg && previewImg.src && previewImg.style.display !== 'none') {
        thumbHtml = `<img src="${escHtml(previewImg.src)}" alt="">`;
      }

      let title = 'Product ' + (idx + 1);
      const previewTitle = row.querySelector('.preview-title');
      if (previewTitle && previewTitle.textContent) {
        title = previewTitle.textContent;
      } else {
        try { title = new URL(link).hostname.replace('www.', '').split('.')[0]; } catch (e) {}
      }

      itemsHtml += `
        <div class="summary-item">
          <div class="summary-item-thumb">${thumbHtml}</div>
          <div class="summary-item-info">
            <div class="summary-item-title">${escHtml(title)}</div>
            <div class="summary-item-meta">Qty: ${qty}</div>
          </div>
        </div>
      `;
    }
  });

  if (itemCount === 0) {
    summaryItems.innerHTML = `
      <div class="summary-empty">
        <i class="fa-solid fa-basket-shopping" style="font-size:1.5rem; color:var(--text-muted); display:block; margin-bottom:0.5rem;"></i>
        Your cart is empty. Add products to see your estimate.
      </div>
    `;
    summaryItemCount.textContent = '0';
    summaryDelivery.textContent = '—';
    summaryService.textContent = '—';
    summaryTotal.textContent = '—';
    if (summaryToggleTotal) summaryToggleTotal.textContent = '—';
  } else {
    summaryItems.innerHTML = itemsHtml;
    summaryItemCount.textContent = itemCount;
    const dlFee = selectedDeliveryFee || 0;
    const rate = totalProductPrice < 2000 ? 0.15 : totalProductPrice <= 5999 ? 0.10 : 0.08;
    const serviceFee = Math.round(totalProductPrice * rate);
    const total = totalProductPrice + serviceFee + SHIPPING_ESTIMATE + dlFee;

    summaryDelivery.textContent = dlFee ? '₹' + dlFee : '—';
    summaryService.textContent = serviceFee ? '~₹' + serviceFee : '—';
    summaryTotal.textContent = total ? '₹' + total.toLocaleString('en-IN') : '—';
    if (summaryToggleTotal) summaryToggleTotal.textContent = summaryTotal.textContent;
  }
}

function toggleSummary() {
  const summary = document.getElementById('orderSummary');
  summary.classList.toggle('visible');
}
window.toggleSummary = toggleSummary;

/* ==========================================================
   FORM STATE (localStorage)
   ========================================================== */
function saveFormState() {
  const data = {
    step: currentStep,
    name: document.getElementById('fullName').value,
    phone: document.getElementById('whatsapp').value,
    email: document.getElementById('email').value,
    city: selectedCity,
    cityFee: selectedDeliveryFee,
    address: document.getElementById('address').value,
    payment: selectedPaymentMethod,
    products: []
  };
  const rows = document.querySelectorAll('.product-row');
  rows.forEach(row => {
    const link = row.querySelector('input[name="product_links"]')?.value || '';
    const qty = row.querySelector('input[name="quantities"]')?.value || '1';
    const notes = row.querySelector('input[name="product_notes"]')?.value || '';
    if (link) data.products.push({ link, qty, notes });
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFormState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data) return;

    if (data.name) document.getElementById('fullName').value = data.name;
    if (data.phone) document.getElementById('whatsapp').value = data.phone;
    if (data.email) document.getElementById('email').value = data.email;
    if (data.address) document.getElementById('address').value = data.address;

    if (data.city) {
      selectedCity = data.city;
      selectedDeliveryFee = data.cityFee || 0;
      window.selectedCity = selectedCity;
      window.selectedDeliveryFee = selectedDeliveryFee;
      document.getElementById('deliveryCity').value = selectedCity;
      document.querySelectorAll('.city-card').forEach(c => {
        c.classList.toggle('selected', c.querySelector('.city-name')?.textContent === selectedCity);
      });
    }

    if (data.payment) {
      selectedPaymentMethod = data.payment;
      window.selectedPaymentMethod = data.payment;
      document.getElementById('paymentMethod').value = data.payment;
      document.querySelectorAll('.payment-card').forEach(c => {
        const name = c.querySelector('.payment-name')?.textContent;
        c.classList.toggle('selected', name === data.payment);
      });
    }

    // Rebuild products
    document.getElementById('productsContainer').innerHTML = '';
    if (data.products && data.products.length > 0) {
      data.products.forEach(p => addProductRow(p));
    } else {
      addProductRow();
    }

    // Restore step if valid
    if (data.step && data.step > 1 && data.step <= 5) {
      // Only restore to step 1 for safety, or max step 3 if they had products
      // We don't auto-advance to review/payment to avoid confusion
    }
    updateOrderSummary();
  } catch (e) {
    console.error('Failed to restore form state', e);
  }
}

/* ==========================================================
   MULTI-STEP FORM STATE
   ========================================================== */
let currentStep = 1;
let selectedCity = '';
let selectedDeliveryFee = 0;
let selectedPaymentMethod = '';

window.currentStep = currentStep;
window.selectedCity = selectedCity;
window.selectedDeliveryFee = selectedDeliveryFee;
window.selectedPaymentMethod = selectedPaymentMethod;

/* ==========================================================
   PAYMENT SELECTION
   ========================================================== */
function selectPayment(method, el) {
  selectedPaymentMethod = method;
  window.selectedPaymentMethod = method;
  document.getElementById('paymentMethod').value = method;
  document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  showErr('err-payment', false);
  saveFormState();
  updateOrderSummary();
}
window.selectPayment = selectPayment;

/* ==========================================================
   CITY SELECTION
   ========================================================== */
function selectCity(city, fee, el) {
  selectedCity = city;
  selectedDeliveryFee = fee;
  window.selectedCity = city;
  window.selectedDeliveryFee = fee;
  document.getElementById('deliveryCity').value = city;
  document.querySelectorAll('.city-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  showErr('err-city', false);
  saveFormState();
  updateOrderSummary();
}
window.selectCity = selectCity;

/* ==========================================================
   STEP VALIDATION
   ========================================================== */
function setValid(el, condition, errId) {
  const errEl = document.getElementById(errId);
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
  let ok = true;

  if (step === 1) {
    const name = document.getElementById('fullName');
    const phone = document.getElementById('whatsapp');
    const email = document.getElementById('email');
    ok = setValid(name, name.value.trim().length >= 2, 'err-name') && ok;
    ok = setValid(phone, validatePhone(phone.value), 'err-phone') && ok;
    ok = setValid(email, validateEmail(email.value), 'err-email') && ok;
  }

  if (step === 2) {
    if (!selectedCity) {
      showErr('err-city', true);
      ok = false;
    } else {
      showErr('err-city', false);
    }
    const addr = document.getElementById('address');
    ok = setValid(addr, addr.value.trim().length >= 5, 'err-address') && ok;
  }

  if (step === 3) {
    const linkInputs = document.querySelectorAll('input[name="product_links"]');
    let hasProduct = false;
    linkInputs.forEach(input => {
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
   GO TO STEP
   ========================================================== */
function goStep(target) {
  if (target > currentStep && !validateStep(currentStep)) return;

  document.querySelectorAll('.step-panel').forEach(panel => {
    panel.classList.remove('active', 'step-reverse');
  });

  const nextPanel = document.getElementById('step-' + target);
  nextPanel.classList.add('active');
  if (target < currentStep) nextPanel.classList.add('step-reverse');

  for (let i = 1; i <= 5; i++) {
    const stepItem = document.getElementById('si-' + i);
    if (!stepItem) continue;
    stepItem.classList.remove('active', 'completed');
    if (i < target) stepItem.classList.add('completed');
    if (i === target) stepItem.classList.add('active');
  }

  if (target === 5) buildReview();

  currentStep = target;
  window.currentStep = target;
  saveFormState();

  const formSection = document.getElementById('order-form');
  const navHeight = mainNav.offsetHeight + 20;
  const formTop = formSection.getBoundingClientRect().top + window.scrollY - navHeight;
  window.scrollTo({ top: formTop, behavior: 'smooth' });
}
window.goStep = goStep;

/* ==========================================================
   BUILD REVIEW
   ========================================================== */
function buildReview() {
  const grid = document.getElementById('reviewGrid');
  const name = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('whatsapp').value.trim();
  const address = document.getElementById('address').value.trim();

  const productRows = document.querySelectorAll('.product-row');
  let productHtml = '';

  productRows.forEach((row, index) => {
    const linkInput = row.querySelector('input[name="product_links"]');
    const qtyInput = row.querySelector('input[name="quantities"]');
    const notesInput = row.querySelector('input[name="product_notes"]');
    const previewImg = row.querySelector('.preview-content img');

    const link = linkInput ? linkInput.value.trim() : '';
    const qty = qtyInput ? qtyInput.value : '1';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (link) {
      let thumb = '';
      if (previewImg && previewImg.src && previewImg.style.display !== 'none') {
        thumb = `<img src="${escHtml(previewImg.src)}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;margin-right:8px;flex-shrink:0;">`;
      }
      productHtml += `
        <div style="display:flex;align-items:center;margin-bottom:8px;padding:8px 0;border-bottom:1px solid #eee;">
          ${thumb}
          <div style="min-width:0;">
            <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(link)}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);">
              Qty: ${escHtml(qty)}${notes ? ' · ' + escHtml(notes) : ''}
            </div>
          </div>
        </div>
      `;
    }
  });

  const fileCount = document.getElementById('fileList').children.length || 0;

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

  const feeEl = document.getElementById('reviewDeliveryFee');
  if (feeEl) feeEl.textContent = selectedDeliveryFee ? '₹' + selectedDeliveryFee : '—';

  const pmEl = document.getElementById('reviewPaymentMethod');
  if (pmEl) pmEl.textContent = selectedPaymentMethod || '—';
}
window.buildReview = buildReview;

/* ==========================================================
   CLEAR FORM
   ========================================================== */
function clearForm() {
  document.getElementById('orderForm').reset();
  document.getElementById('fileList').innerHTML = '';
  _objectUrls.forEach(u => URL.revokeObjectURL(u));
  _objectUrls = [];
  document.getElementById('productsContainer').innerHTML = '';
  addProductRow();
  document.querySelectorAll('.field-error-msg').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.product-preview').forEach(el => el.style.display = 'none');
  document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('field-error'));
  document.querySelectorAll('.city-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
  selectedCity = '';
  selectedDeliveryFee = 0;
  selectedPaymentMethod = '';
  window.selectedCity = '';
  window.selectedDeliveryFee = 0;
  window.selectedPaymentMethod = '';
  localStorage.removeItem(STORAGE_KEY);
  updateOrderSummary();
  goStep(1);
}
window.clearForm = clearForm;

/* ==========================================================
   ORDER ID GENERATION
   ========================================================== */
function generateOrderId() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 8);
  return 'S2B-' + year + month + day + '-' + suffix;
}

/* ==========================================================
   COPY ORDER ID
   ========================================================== */
document.getElementById('popupOrderId').addEventListener('click', function() {
  const text = this.textContent;
  if (!text || text === '—') return;
  const self = this;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Order ID copied!');
    self.style.opacity = '0.6';
    setTimeout(() => self.style.opacity = '', 600);
  }).catch(() => {
    const el = document.createElement('textarea');
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
  const path = `${orderId}/${Date.now()}_${safeName}`;

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
const form = document.getElementById('orderForm');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async function(e) {
  e.preventDefault();

  const nameVal = sanitize(document.getElementById('fullName').value.trim());
  const phoneVal = sanitize(document.getElementById('whatsapp').value.trim());
  const emailVal = sanitize(document.getElementById('email').value.trim());
  const cityVal = sanitize(document.getElementById('deliveryCity').value);
  const addressVal = sanitize(document.getElementById('address').value);
  const paymentMethod = document.getElementById('paymentMethod').value || '';

  const linkInputs = form.querySelectorAll('input[name="product_links"]');
  const qtyInputs = form.querySelectorAll('input[name="quantities"]');
  const links = [];
  const qtys = [];

  linkInputs.forEach((inp, i) => {
    const link = inp.value.trim();
    if (link) {
      links.push(link);
      qtys.push(parseInt(qtyInputs[i] ? (qtyInputs[i].value || '1') : '1', 10) || 1);
    }
  });

  // Validation
  let hasError = false;
  showErr('err-name', !nameVal);
  showErr('err-phone', !validatePhone(phoneVal));
  showErr('err-email', !validateEmail(emailVal));
  showErr('err-city', !cityVal);
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

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting…';

  const orderId = generateOrderId();
  const fileInput = document.getElementById('fileInput');
  const uploadedUrls = [];

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
    // User lookup / creation
    let { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('whatsapp', phoneVal)
      .maybeSingle();

    if (userErr) throw userErr;

    if (!user && emailVal) {
      const { data: userByEmail, error: emailErr } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('email', emailVal)
        .maybeSingle();
      if (emailErr) throw emailErr;
      if (userByEmail) user = userByEmail;
    }

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
    } else if ((!user.email || user.email === '') && emailVal) {
      await supabase
        .from('users')
        .update({ email: emailVal })
        .eq('id', user.id);
    }

    // Insert order
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
    }]).select();

    if (orderError) throw orderError;
    const orderUuid = orderInsertData[0].id;

    // Insert payment
    const { error: paymentError } = await supabase.from('payments').insert([{
      order_id: orderId,
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

    // WhatsApp message
    const productsText = links.map((link, i) => {
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
      '\n\n👉 You can also view all your orders at: https://shop2bt.vercel.app/portal.html';

    document.getElementById('whatsappConfirmBtn').href =
      'https://wa.me/97577113302?text=' + encodeURIComponent(message);

    document.getElementById('popupOrderId').textContent = orderId;
    document.getElementById('successPopup').classList.add('open');

    // Clear saved state on success
    localStorage.removeItem(STORAGE_KEY);

  } catch (err) {
    console.error('FULL SUBMISSION ERROR:', err);
    showToast('❌ Failed to submit order: ' + (err.message || 'Unknown error'), 5000);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Order Request';
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
function openReviewForm() {
  document.getElementById('reviewModal').classList.add('open');
}
function closeReviewForm() {
  document.getElementById('reviewModal').classList.remove('open');
  document.getElementById('reviewName').value = '';
  document.getElementById('reviewLocation').value = '';
  document.getElementById('reviewRating').value = '5';
  document.getElementById('reviewText').value = '';
  document.getElementById('reviewOrderId').value = '';
}
window.openReviewForm = openReviewForm;
window.closeReviewForm = closeReviewForm;

/* ==========================================================
   SUBMIT REVIEW
   ========================================================== */
async function submitReview() {
  const name = document.getElementById('reviewName').value.trim();
  const location = document.getElementById('reviewLocation').value.trim();
  const rating = document.getElementById('reviewRating').value;
  const message = document.getElementById('reviewText').value.trim();
  const orderId = document.getElementById('reviewOrderId').value.trim();

  if (!name || !message) {
    showToast('Please fill in your name and review.');
    return;
  }

  const btn = document.getElementById('reviewSubmitBtn');
  btn.disabled = true;
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
        full_name: name,
        city: location || 'Bhutan',
        rating: parseInt(rating),
        message: message,
        order_id: orderId || null,
        is_verified_buyer: isVerified,
        is_approved: false,
      }]);

    if (error) throw error;
    showToast('Review submitted! It will appear after approval.');
    closeReviewForm();
  } catch (err) {
    console.error('FULL REVIEW ERROR:', err);
    showToast('Failed to submit review: ' + (err.message || 'unknown error'));
  } finally {
    btn.disabled = false;
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
    .then(({ data, error }) => {
      if (error) {
        console.error(error);
        grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Unable to load reviews right now.</p>';
        return;
      }
      if (!data || data.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;">No reviews yet — be the first!</p>';
        return;
      }
      grid.innerHTML = data.map(r => {
        return `
          <div class="testi-card">
            <div class="testi-stars">
              ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
            </div>
            <p class="testi-text">${escHtml(r.message)}</p>
            <div class="testi-author">
              <div class="testi-avatar">${getInitials(r.full_name)}</div>
              <div>
                <div class="testi-name">
                  ${escHtml(r.full_name)}
                  ${r.is_verified_buyer ? ' <span class="verified-badge"><i class="fa-solid fa-circle-check"></i> Verified Buyer</span>' : ''}
                </div>
                <div class="testi-location">${escHtml(r.city || 'Bhutan')}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    });
}
window.loadReviews = loadReviews;

/* ==========================================================
   LIVE ACTIVITY TICKER
   ========================================================== */
const TICKER_FALLBACK = [
  { icon: '🛒', text: 'Tenzin ordered from Amazon', city: 'Thimphu', time: '2 mins ago' },
  { icon: '📦', text: 'Delivered to Paro', city: 'Paro', time: '5 mins ago' },
  { icon: '🛒', text: 'Pema ordered from Myntra', city: 'Phuntsholing', time: '8 mins ago' },
  { icon: '🚚', text: 'Package collected from Jaigaon', city: 'Jaigaon', time: '12 mins ago' },
  { icon: '🛒', text: 'Karma ordered from Flipkart', city: 'Thimphu', time: '15 mins ago' },
  { icon: '📦', text: 'Delivered to Thimphu', city: 'Thimphu', time: '18 mins ago' },
  { icon: '🛒', text: 'Dorji ordered from Meesho', city: 'Paro', time: '22 mins ago' },
  { icon: '🚚', text: 'Package arrived at Jaigaon hub', city: 'Jaigaon', time: '25 mins ago' },
  { icon: '🛒', text: 'Sonam ordered from Amazon', city: 'Phuntsholing', time: '30 mins ago' },
  { icon: '📦', text: 'Delivered to Phuntsholing', city: 'Phuntsholing', time: '35 mins ago' },
  { icon: '🛒', text: 'Ugyen ordered from Myntra', city: 'Thimphu', time: '40 mins ago' },
  { icon: '🚚', text: 'Crossing Bhutan border', city: 'Phuntsholing', time: '45 mins ago' },
];

async function loadLiveTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  let items = [];

  // Try to fetch real orders from Supabase
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_id, delivery_city, product_links, order_status, created_at')
      .order('created_at', { ascending: false })
      .limit(8);

    if (!error && orders && orders.length > 0) {
      const now = new Date();
      items = orders.map(o => {
        const minsAgo = Math.floor((now - new Date(o.created_at)) / 60000);
        const timeText = minsAgo < 1 ? 'Just now' : minsAgo < 60 ? minsAgo + ' mins ago' : Math.floor(minsAgo / 60) + ' hours ago';

        // Extract store name from first product link
        let store = 'a store';
        try {
          const link = o.product_links?.[0] || '';
          const host = new URL(link).hostname.replace('www.', '').split('.')[0];
          store = host.charAt(0).toUpperCase() + host.slice(1);
        } catch (e) {}

        const isDelivered = o.order_status === 'delivered';
        return {
          icon: isDelivered ? '📦' : '🛒',
          text: isDelivered ? 'Delivered to ' + (o.delivery_city || 'Bhutan') : 'Ordered from ' + store,
          city: o.delivery_city || 'Bhutan',
          time: timeText
        };
      });
    }
  } catch (e) {
    console.log('Ticker: using fallback data');
  }

  // Use fallback if no real data
  if (items.length === 0) {
    items = TICKER_FALLBACK;
  }

  // Build ticker HTML - duplicate for seamless loop
  const buildItems = (arr) => arr.map(item => `
    <div class="ticker-item">
      <span>${item.icon}</span>
      <span>${escHtml(item.text)}</span>
      <span class="ticker-city">${escHtml(item.city)}</span>
      <span class="ticker-time">${escHtml(item.time)}</span>
    </div>
  `).join('');

  const liveBadge = `
    <div class="ticker-live-badge">
      <span class="live-dot"></span>
      Live
    </div>
  `;

  const itemsHtml = buildItems(items);
  track.innerHTML = liveBadge + itemsHtml + itemsHtml; // Duplicate for seamless loop
}
window.loadLiveTicker = loadLiveTicker;

/* ==========================================================
   INIT
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Show mobile summary bar on small screens
  if (window.innerWidth <= 1024) {
    const toggle = document.getElementById('summaryToggle');
    if (toggle) toggle.style.display = 'flex';
  }

  addProductRow();
  loadFormState();
  loadReviews();
  loadLiveTicker();
});