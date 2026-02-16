// Check if user is logged in
function checkAuth() {
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  
  if (!userId) {
    window.location.href = 'login.html';
    return false;
  }
  
  const navLogo = document.querySelector('.nav-logo');
  if (navLogo && username) {
    navLogo.innerHTML += ` <span style="font-size: 14px; color: #94a3b8; margin-left: 10px;">Hi, ${username}!</span>`;
  }
  
  return true;
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;
  
  const cards = document.querySelectorAll('.card');

  async function sendMovie(movieId, statusEl, btn) {
    if (!movieId) return;
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please login first!');
      window.location.href = 'login.html';
      return;
    }
    
    try {
      if (btn) btn.disabled = true;
      statusEl.textContent = 'Saving...';

      const res = await fetch('/api/movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: Number(movieId), user_id: Number(userId) })
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const data = await res.json();
      if (data && data.success) {
        statusEl.textContent = 'Saved ✓';
        setTimeout(() => { statusEl.textContent = ''; }, 1800);
      } else {
        statusEl.textContent = 'Failed to save';
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Error saving';
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  cards.forEach(card => {
    const btn = card.querySelector('.watch-btn');
    const statusEl = card.querySelector('.status');
    const movieId = card.dataset.movieId;

    // click on the button
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sendMovie(movieId, statusEl, btn);
      });
    }

    // click anywhere on the card
    card.addEventListener('click', () => sendMovie(movieId, statusEl, btn));

    // keyboard accessibility (Enter key)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sendMovie(movieId, statusEl, btn);
      }
    });
  });
  
  // Load notification count
  loadNotificationCount();
  
  // Add logout button
  const nav = document.querySelector('nav');
  if (nav) {
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Logout';
    logoutBtn.style.cssText = `
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
    `;
    logoutBtn.onmouseover = () => {
      logoutBtn.style.transform = 'translateY(-2px)';
      logoutBtn.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
    };
    logoutBtn.onmouseout = () => {
      logoutBtn.style.transform = 'translateY(0)';
      logoutBtn.style.boxShadow = 'none';
    };
    logoutBtn.onclick = logout;
    nav.appendChild(logoutBtn);
  }
});

async function loadNotificationCount() {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    const res = await fetch(`/api/notifications/${userId}`);
    const data = await res.json();
    
    if (data.success && data.notifications) {
      const unreadCount = data.notifications.filter(n => !n.is_read).length;
      const badge = document.getElementById('notif-badge');
      
      if (unreadCount > 0 && badge) {
        badge.textContent = unreadCount;
        badge.style.display = 'block';
      }
    }
  } catch (err) {
    console.error('Failed to load notification count:', err);
  }
}
