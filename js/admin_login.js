import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://deecrnfbvgbzyybqhywy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const errorDiv = document.getElementById('error-message');
const errorText = errorDiv.querySelector('.error-text');
const submitBtn = form.querySelector('.submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnIcon = submitBtn.querySelector('.btn-icon');
const spinner = submitBtn.querySelector('.spinner');

const EYE_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_SLASH = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

// =========================
// Session check
// =========================
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: admin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (admin) {
    window.location.replace('/admin-reviews.html');
  }
}

// =========================
// UI helpers
// =========================
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.textContent = isLoading ? 'Signing in...' : 'Sign In';
  btnIcon.classList.toggle('hidden', isLoading);
  spinner.classList.toggle('hidden', !isLoading);
}

function showError(msg) {
  errorText.textContent = msg;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  errorDiv.classList.add('hidden');
}

// =========================
// Remember me
// =========================
function restoreRememberedEmail() {
  const saved = localStorage.getItem('admin_remember_email');
  if (saved) {
    rememberCheckbox.checked = true;
    emailInput.value = saved;
  }
}

function saveRememberedEmail() {
  const email = emailInput.value.trim();
  if (rememberCheckbox.checked) {
    localStorage.setItem('admin_remember_email', email);
  } else {
    localStorage.removeItem('admin_remember_email');
  }
}

// =========================
// Password toggle
// =========================
document.querySelector('.toggle-password')?.addEventListener('click', function () {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  this.innerHTML = isHidden ? EYE_SLASH : EYE_OPEN;
});

// =========================
// Login handler
// =========================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  setLoading(true);

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Verify admin access
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      throw new Error('You are not authorized to access the admin panel.');
    }

    saveRememberedEmail();
    window.location.replace('/admin-reviews.html');

  } catch (err) {
    showError(err.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
});

// =========================
// Init
// =========================
restoreRememberedEmail();
checkSession();