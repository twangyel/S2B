import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://deecrnfbvgbzyybqhywy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWNybmZidmdienl5YnFoeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzk4MTAsImV4cCI6MjA5NDY1NTgxMH0.zO07GeHD-EW_6589vP07nTP95zFNIhp8YG57I5vWOf8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('login-form');
const errorDiv = document.getElementById('error-message');

// =========================
// Check existing session
// =========================
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (admin) {
      window.location.replace('/admin-reviews.html');
    }
  }
}

// =========================
// Login
// =========================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDiv.style.display = 'none';

  const button = form.querySelector('button');
  button.disabled = true;
  button.textContent = 'Signing in...';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

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
      throw new Error('You are not authorized to access admin panel.');
    }

    window.location.replace('/admin-reviews.html');

  } catch (err) {
    errorDiv.textContent = err.message || 'Login failed';
    errorDiv.style.display = 'block';
  } finally {
    button.disabled = false;
    button.textContent = 'Log in';
  }
});

// =========================
// Toggle password visibility (eye button)
// =========================
document.querySelector('.toggle-password')?.addEventListener('click', function() {
  const passwordInput = document.getElementById('password');
  const isHidden = passwordInput.type === 'password';
  
  passwordInput.type = isHidden ? 'text' : 'password';
  
  // Optional: swap icon to eye-slash when visible
  this.innerHTML = isHidden
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
         <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
         <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
         <line x1="2" x2="22" y1="2" y2="22"/>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
         <circle cx="12" cy="12" r="3"/>
       </svg>`;
});

// =========================
// Remember me checkbox
// =========================
const rememberCheckbox = document.getElementById('remember');

// Restore checkbox state
if (localStorage.getItem('admin_remember_email')) {
  rememberCheckbox.checked = true;
  document.getElementById('email').value = localStorage.getItem('admin_remember_email');
}

// Save email when logging in with Remember me checked
form.addEventListener('submit', () => {
  if (rememberCheckbox.checked) {
    localStorage.setItem('admin_remember_email', document.getElementById('email').value.trim());
  } else {
    localStorage.removeItem('admin_remember_email');
  }
});

checkSession();