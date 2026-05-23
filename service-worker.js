/* ========== PWA + OFFLINE (Robust) ========== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.log('SW registration failed:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const offlineBanner = document.getElementById('offline-banner');
  if (!offlineBanner) return;

  function updateOnlineStatus() {
    if (navigator.onLine) {
      offlineBanner.classList.add('hidden');
      offlineBanner.style.display = 'none';
    } else {
      offlineBanner.classList.remove('hidden');
      offlineBanner.style.display = '';
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Delay check slightly so the browser has time to settle
  setTimeout(updateOnlineStatus, 100);
});