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

checkSession();