/* ==========================================================
   HAMBURGER — close on outside click
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
  if (!mainNav.contains(e.target)) {
    mobileMenu.classList.remove('open');
  }
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

/* ==========================================================
   FEE ESTIMATOR
   ========================================================== */
var SHIPPING_ESTIMATE = 40;

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
  var total      = Math.round(price + serviceFee + shipping + dlcharge);

  document.getElementById('estBase').textContent          = '₹ ' + Math.round(price).toLocaleString('en-IN');
  document.getElementById('estServiceCharge').textContent = '₹ ' + serviceFee.toLocaleString('en-IN');
  document.getElementById('estShipping').textContent      = '~₹ ' + shipping.toLocaleString('en-IN');
  document.getElementById('dchargeDisplay').textContent   = '₹ ' + Math.round(dlcharge).toLocaleString('en-IN');
  document.getElementById('estTotal').textContent         = '₹ ' + total.toLocaleString('en-IN');
}

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

// Init first row
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
    var title  = ((doc.querySelector('meta[property="og:title"]') || {}).content)
              || ((doc.querySelector('meta[name="og:title"]') || {}).content)
              || doc.title || '';
    var imgUrl = ((doc.querySelector('meta[property="og:image"]') || {}).content)
              || ((doc.querySelector('meta[name="og:image"]') || {}).content) || '';
    var site   = ((doc.querySelector('meta[property="og:site_name"]') || {}).content) || brandFallback;

    title = title.replace(/\s*[-|–]\s*(Amazon|Flipkart|Myntra|Meesho).*/i, '').trim();
    if (title.length > 100) title = title.slice(0, 100) + '…';

    if (!title && !imgUrl) { tryMicrolink(); return; }
    done = true;
    renderPreview(preview, title || brandFallback + ' product', imgUrl, site);
  }

  function tryMicrolink() {
    if (done) return;
    fetch('https://api.microlink.io/?url=' + encodeURIComponent(url) + '&palette=false&audio=false&video=false&iframe=false')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (done) return;
        if (data.status !== 'success') { showFallback(); return; }
        done = true;
        var d     = data.data;
        var title = (d.title || '').replace(/\s*[-|–]\s*(Amazon|Flipkart|Myntra|Meesho).*/i, '').trim();
        renderPreview(preview, title || brandFallback + ' product', (d.image && d.image.url) || '', d.publisher || brandFallback);
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

  var imgHtml      = imgUrl ? '<img class="preview-img" src="' + escHtml(imgUrl) + '" alt="Product" onerror="this.style.display=\'none\'">' : '';
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

  preview.querySelector('.preview-title').textContent = title;
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

/* ==========================================================
   FORM VALIDATION
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
   FORM SUBMISSION
   ========================================================== */
var form      = document.getElementById('orderForm');
var submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async function(e) {
  e.preventDefault();

  var nameVal    = sanitize(form.querySelector('[name="fi-sender-fullName"]').value);
  var phoneVal   = sanitize(form.querySelector('[name="fi-text-whatsapp"]').value);
  var cityVal    = form.querySelector('[name="fi-text-city"]').value;
  var addressVal = sanitize(form.querySelector('[name="fi-text-address"]').value);

  var ok = true;
  showErr('err-name', !nameVal);
  if (!nameVal) ok = false;
  if (!validatePhone(phoneVal)) { showErr('err-phone', true); ok = false; } else showErr('err-phone', false);
  if (!cityVal) { showErr('err-city', true); ok = false; } else showErr('err-city', false);
  if (!addressVal) { showErr('err-address', true); ok = false; } else showErr('err-address', false);

  var productInputs  = form.querySelectorAll('input[name="product_links"]');
  var quantityInputs = form.querySelectorAll('input[name="quantities"]');
  var productsText   = '';
  productInputs.forEach(function(inp, i) {
    var link = inp.value.trim();
    if (!link) return;
    var qty = (quantityInputs[i] ? quantityInputs[i].value : '1') || '1';
    productsText += (productsText ? '\n' : '') + (i + 1) + '. ' + link + ' (Qty: ' + qty + ')';
  });

  if (!productsText.trim()) {
    ok = false;
    alert('Please add at least one product link or description.');
  }

  if (!ok) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';
  document.getElementById('hiddenProducts').value = productsText.trim();

  var formData = new FormData(form);
  formData.delete('product_links');
  formData.delete('quantities');

  try {
    var response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      var orderId = generateOrderId();

      var screenshotInput = form.querySelector('input[name="fi-file-screenshot"]');
      var fileCount       = screenshotInput && screenshotInput.files ? screenshotInput.files.length : 0;
      var screenshotNote  = fileCount > 0
        ? '\n\n📎 Screenshots: ' + fileCount + ' file' + (fileCount > 1 ? 's' : '') + ' uploaded via form (check submission dashboard).'
        : '';

      var message = 'Hello Shop2Bhutan,\n\n'
        + '🆔 *Order ID*: ' + orderId + '\n\n'
        + 'Name: ' + nameVal + '\n'
        + 'WhatsApp: ' + phoneVal + '\n'
        + 'City: ' + cityVal + '\n'
        + 'Address: ' + addressVal + '\n\n'
        + 'Products:\n' + productsText
        + screenshotNote
        + '\n\nPlease confirm availability, total price (including service charge), and next steps.';

      var waUrl = 'https://wa.me/97577113302?text=' + encodeURIComponent(message);
      document.getElementById('whatsappConfirmBtn').href = waUrl;

      var popupOrderEl = document.getElementById('popupOrderId');
      popupOrderEl.textContent = orderId;
      popupOrderEl.style.cursor = 'pointer';
      popupOrderEl.onclick = function() {
        navigator.clipboard.writeText(orderId).then(function() {
          document.getElementById('copyNote').textContent = '✓ Copied to clipboard!';
          showToast('Order ID copied!');
          setTimeout(function() {
            document.getElementById('copyNote').textContent = 'Tap the ID above to copy it';
          }, 3000);
        });
      };

      document.getElementById('successPopup').classList.add('open');

    } else {
      alert('Something went wrong. Please try again or contact us on WhatsApp.');
    }

  } catch(err) {
    alert('Network error. Please check your connection and try again.');
  } finally {
    submitBtn.disabled = false;
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
document.getElementById('successPopup').addEventListener('click', function(e) {
  if (e.target === this) closePopup();
});

// Hide field errors on input
form.querySelectorAll('input, textarea, select').forEach(function(el) {
  el.addEventListener('input', function() {
    var errMap = {
      'fi-sender-fullName': 'err-name',
      'fi-text-whatsapp':   'err-phone',
      'fi-text-city':       'err-city',
      'fi-text-address':    'err-address',
    };
    var errId = errMap[this.name];
    if (errId) showErr(errId, false);
  });
});

/* ==========================================================
   REVIEW MODAL
   ========================================================== */
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzsx2seoPcISRsq63__0q1Zcmh7fihRimpmHml6z10wj3pRn6f8qP4VsSDD4sEL_2wn/exec';

function openReviewForm() {
  document.getElementById('reviewModal').classList.add('open');
}

function closeReviewForm() {
  document.getElementById('reviewModal').classList.remove('open');
}

document.getElementById('reviewModal').addEventListener('click', function(e) {
  if (e.target === this) closeReviewForm();
});

/* ==========================================================
   SUBMIT REVIEW
   ========================================================== */
async function submitReview() {
  var name     = document.getElementById('reviewName').value.trim();
  var location = document.getElementById('reviewLocation').value.trim();
  var rating   = document.getElementById('reviewRating').value;
  var review   = document.getElementById('reviewText').value.trim();

  if (!name) { alert('Please enter your name.'); return; }
  if (!review) { alert('Please write your review.'); return; }
  if (review.length < 10) { alert('Review is too short. Please write at least 10 characters.'); return; }

  var btn = document.getElementById('reviewSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting…';

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ name: name, location: location, rating: rating, review: review })
    });

    showToast('Review submitted! Thank you 🙏');
    closeReviewForm();

    document.getElementById('reviewName').value     = '';
    document.getElementById('reviewLocation').value = '';
    document.getElementById('reviewRating').value   = '5';
    document.getElementById('reviewText').value     = '';

    setTimeout(loadReviews, 1500);

  } catch(err) {
    alert('Could not submit review. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Review';
  }
}

/* ==========================================================
   LOAD & RENDER REVIEWS
   ========================================================== */
var AVATAR_COLORS = ['#1a56db','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#9333ea'];

function getInitials(name) {
  return (name || 'A').split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
}

function renderStars(n) {
  var s = '';
  for (var i = 0; i < 5; i++) s += i < n ? '★' : '☆';
  return s;
}

function renderReviews(reviews) {
  var grid = document.getElementById('testiGrid');
  if (!reviews || reviews.length === 0) {
    grid.innerHTML = '<div class="testi-empty">No reviews yet. Be the first to share your experience!</div>';
    return;
  }
  grid.innerHTML = reviews.map(function(r, i) {
    var color    = AVATAR_COLORS[i % AVATAR_COLORS.length];
    var initials = getInitials(r.name);
    var stars    = parseInt(r.rating) || 5;
    return [
      '<div class="testi-card">',
        '<div class="testi-stars">' + renderStars(stars) + '</div>',
        '<p class="testi-text">' + escHtml(r.review || '') + '</p>',
        '<div class="testi-author">',
          '<div class="testi-avatar" style="background:' + color + '">' + escHtml(initials) + '</div>',
          '<div>',
            '<div class="testi-name">' + escHtml(r.name || 'Anonymous') + '</div>',
            '<div class="testi-location">' + escHtml(r.location || 'Bhutan') + '</div>',
          '</div>',
        '</div>',
      '</div>',
    ].join('');
  }).join('');
}

function loadReviews() {
  var grid = document.getElementById('testiGrid');
  grid.innerHTML = '<div class="testi-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading reviews…</div>';

  fetch(SCRIPT_URL)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var reviews = Array.isArray(data) ? data : (data.data || []);
      renderReviews(reviews);
    })
    .catch(function() {
      renderReviews([
        { name: 'Pema Wangchuk', location: 'Thimphu', rating: 5, review: 'Super easy service! Ordered from Amazon India and got it delivered to Thimphu in less than a week. Highly recommended.' },
        { name: 'Sonam Choden', location: 'Phuntsholing', rating: 5, review: 'Finally I can shop online without needing an Indian account. Very smooth process and friendly communication on WhatsApp.' },
        { name: 'Tshering Dorji', location: 'Paro', rating: 4, review: 'Good service. Package was well packed. Will definitely order again for my next purchase from Flipkart.' },
      ]);
    });
}

// Load reviews on page load
loadReviews();
