// Main JS for DVMS
// Dark mode init
(function() {
  const saved = localStorage.getItem('dvms_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('dvms_theme', isDark ? 'dark' : 'light');
  updateThemeIcons();
  // Update charts if needed
  if (window.Chart) {
    Chart.defaults.color = isDark ? '#cbd5e1' : '#64748b';
  }
}
window.toggleTheme = toggleTheme;

function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  document.querySelectorAll('[data-theme-icon]').forEach(icon => {
    icon.innerHTML = isDark 
      ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'
      : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcons();
  // Auth check
  const isLoginPage = window.location.pathname.includes('login.html');
  const user = localStorage.getItem('dvms_user');
  if (!isLoginPage && !user) {
    window.location.href = 'login.html';
    return;
  }
  if (isLoginPage && user) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Init data
  const data = DVMS.getData();

  // Sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      sidebarOverlay.classList.toggle('hidden');
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.add('-translate-x-full');
      sidebarOverlay.classList.add('hidden');
    });
  }

  // Logout
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('dvms_user');
      window.location.href = 'login.html';
    });
  });

  // Populate user name
  document.querySelectorAll('[data-username]').forEach(el => {
    el.textContent = user || 'Admin';
  });

  // DASHBOARD STATS
  if (document.getElementById('statsGrid')) {
    const today = DVMS.today();
    const todayVisitors = data.visitors.filter(v => v.checkIn.startsWith(today));
    const activeVisitors = data.visitors.filter(v => v.status === 'active');
    const completedToday = todayVisitors.filter(v => v.status === 'completed');
    
    document.getElementById('statToday').textContent = todayVisitors.length;
    document.getElementById('statActive').textContent = activeVisitors.length;
    document.getElementById('statCompleted').textContent = completedToday.length;
    document.getElementById('statBlacklist').textContent = data.blacklist.length;

    // Recent visitors table
    const recentTbody = document.getElementById('recentVisitors');
    if (recentTbody) {
      recentTbody.innerHTML = todayVisitors.slice(0,5).map(v => `
        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <img src="${v.photo}" class="w-9 h-9 rounded-full" />
              <div>
                <p class="font-medium text-slate-800 dark:text-slate-200">${v.name}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">${v.id}</p>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 text-sm">${v.personToMeet}</td>
          <td class="py-3 px-4 text-sm">${v.purpose}</td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium ${v.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300':'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}">
              ${v.status==='active'?'Active':'Completed'}
            </span>
          </td>
          <td class="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">${new Date(v.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
        </tr>
      `).join('');
    }
  }

  // ADD VISITOR FORM
  const addForm = document.getElementById('addVisitorForm');
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(addForm);
      const visitor = {
        id: DVMS.generateId(),
        name: formData.get('name').trim(),
        mobile: formData.get('mobile').trim(),
        address: formData.get('address').trim(),
        purpose: formData.get('purpose'),
        personToMeet: formData.get('person').trim(),
        checkIn: new Date().toISOString(),
        checkOut: null,
        status: 'active',
        photo: `https://i.pravatar.cc/150?u=${Date.now()}`
      };

      // Validation
      let valid = true;
      addForm.querySelectorAll('[required]').forEach(input => {
        const error = input.parentElement.querySelector('.error-msg');
        if (!input.value.trim()) {
          valid = false;
          input.classList.add('border-red-500');
          if (error) error.classList.remove('hidden');
        } else {
          input.classList.remove('border-red-500');
          if (error) error.classList.add('hidden');
        }
      });
      
      const mobile = visitor.mobile;
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        valid = false;
        const mobileInput = addForm.querySelector('[name=mobile]');
        mobileInput.classList.add('border-red-500');
        mobileInput.parentElement.querySelector('.error-msg').textContent = 'Enter valid 10-digit Indian mobile';
        mobileInput.parentElement.querySelector('.error-msg').classList.remove('hidden');
      }

      // Blacklist check
      const isBlacklisted = data.blacklist.some(b => b.mobile === mobile);
      if (isBlacklisted) {
        showToast('Visitor is blacklisted! Cannot check-in.', 'error');
        return;
      }

      if (!valid) return;

      data.visitors.unshift(visitor);
      DVMS.saveData(data);
      showToast('Visitor checked-in successfully!', 'success');
      addForm.reset();
      setTimeout(() => window.location.href = 'visitors.html', 800);
    });
  }

  // VISITORS LIST
  const visitorsTable = document.getElementById('visitorsTable');
  if (visitorsTable) {
    let filtered = [...data.visitors];
    let currentPage = 1;
    const perPage = 8;

    const searchInput = document.getElementById('searchVisitor');
    const statusFilter = document.getElementById('statusFilter');

    function renderTable() {
      const start = (currentPage - 1) * perPage;
      const pageData = filtered.slice(start, start + perPage);
      
      visitorsTable.innerHTML = pageData.map(v => `
        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <img src="${v.photo}" class="w-10 h-10 rounded-full object-cover" />
              <div>
                <p class="font-medium text-slate-800 dark:text-slate-200">${v.name}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">${v.id} • ${v.mobile}</p>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 text-sm hidden md:table-cell">${v.purpose}</td>
          <td class="py-3 px-4 text-sm hidden lg:table-cell">${v.personToMeet}</td>
          <td class="py-3 px-4 text-sm">${new Date(v.checkIn).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium ${v.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300':'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}">
              ${v.status}
            </span>
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-2">
              <button data-view="${v.id}" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400" title="View">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
              <button data-edit="${v.id}" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400" title="Edit">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              ${v.status==='active' ? `<button data-exit="${v.id}" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg text-red-600 dark:text-red-400" title="Check Out">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>` : ''}
            </div>
          </td>
        </tr>
      `).join('');

      // Pagination
      const totalPages = Math.ceil(filtered.length / perPage);
      document.getElementById('paginationInfo').textContent = `Showing ${start+1}-${Math.min(start+perPage, filtered.length)} of ${filtered.length}`;
      document.getElementById('prevPage').disabled = currentPage === 1;
      document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    function applyFilters() {
      const q = searchInput.value.toLowerCase();
      const status = statusFilter.value;
      filtered = data.visitors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(q) || v.mobile.includes(q) || v.id.toLowerCase().includes(q);
        const matchesStatus = status === 'all' || v.status === status;
        return matchesSearch && matchesStatus;
      });
      currentPage = 1;
      renderTable();
    }

    searchInput?.addEventListener('input', applyFilters);
    statusFilter?.addEventListener('change', applyFilters);
    document.getElementById('prevPage')?.addEventListener('click', () => { if (currentPage>1) {currentPage--; renderTable();}});
    document.getElementById('nextPage')?.addEventListener('click', () => { const total = Math.ceil(filtered.length/perPage); if (currentPage<total) {currentPage++; renderTable();}});

    // Actions
    visitorsTable.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('[data-view]');
      const exitBtn = e.target.closest('[data-exit]');
      const editBtn = e.target.closest('[data-edit]');
      
      if (viewBtn) openVisitorModal(viewBtn.dataset.view);
      if (exitBtn) {
        const v = data.visitors.find(x => x.id === exitBtn.dataset.exit);
        if (v) {
          v.status = 'completed';
          v.checkOut = new Date().toISOString();
          DVMS.saveData(data);
          showToast(`${v.name} checked out`, 'success');
          applyFilters();
        }
      }
      if (editBtn) showToast('Edit feature - demo only', 'info');
    });

    renderTable();
  }

  // VISITOR MODAL
  function openVisitorModal(id) {
    const v = data.visitors.find(x => x.id === id);
    if (!v) return;
    const modal = document.getElementById('visitorModal');
    const content = document.getElementById('visitorModalContent');
    const history = data.history.find(h => h.visitorId === id)?.visits || 1;
    
    content.innerHTML = `
      <div class="flex items-start gap-4">
        <img src="${v.photo}" class="w-20 h-20 rounded-2xl object-cover" />
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-slate-900 dark:text-white">${v.name}</h3>
          <p class="text-slate-500 dark:text-slate-400">${v.id} • ${v.mobile}</p>
          <div class="mt-2 flex gap-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium ${v.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300':'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}">${v.status.toUpperCase()}</span>
            <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">${history} visits</span>
          </div>
        </div>
        <button onclick="document.getElementById('visitorModal').classList.add('hidden')" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
          <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Purpose</p>
          <p class="font-medium mt-1">${v.purpose}</p>
        </div>
        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
          <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Person to Meet</p>
          <p class="font-medium mt-1">${v.personToMeet}</p>
        </div>
        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
          <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Address</p>
          <p class="font-medium mt-1">${v.address}</p>
        </div>
        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
          <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Check-in</p>
          <p class="font-medium mt-1">${new Date(v.checkIn).toLocaleString('en-IN')}</p>
        </div>
        ${v.checkOut ? `<div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl md:col-span-2">
          <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Check-out</p>
          <p class="font-medium mt-1">${new Date(v.checkOut).toLocaleString('en-IN')}</p>
        </div>` : ''}
      </div>
      <div class="mt-6">
        <h4 class="font-semibold mb-3">Visit History</h4>
        <div class="space-y-2">
          ${[...Array(Math.min(history,4))].map((_,i) => `
            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <p class="text-sm font-medium">Visit #${history-i}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">${new Date(Date.now() - i*86400000*7).toLocaleDateString('en-IN')}</p>
              </div>
              <span class="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">Completed</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  }
  window.openVisitorModal = openVisitorModal;

  // BLACKLIST
  const blacklistTable = document.getElementById('blacklistTable');
  if (blacklistTable) {
    function renderBlacklist() {
      blacklistTable.innerHTML = data.blacklist.map(b => `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="py-3 px-4">
            <p class="font-medium">${b.name}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">${b.id}</p>
          </td>
          <td class="py-3 px-4 text-sm">${b.mobile}</td>
          <td class="py-3 px-4 text-sm max-w-xs truncate">${b.reason}</td>
          <td class="py-3 px-4 text-sm hidden md:table-cell">${b.addedOn}</td>
          <td class="py-3 px-4">
            <button data-remove="${b.id}" class="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 rounded-lg">Remove</button>
          </td>
        </tr>
      `).join('');
    }
    renderBlacklist();

    blacklistTable.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (btn) {
        data.blacklist = data.blacklist.filter(b => b.id !== btn.dataset.remove);
        DVMS.saveData(data);
        renderBlacklist();
        showToast('Removed from blacklist', 'success');
        document.getElementById('statBlacklist') && (document.getElementById('statBlacklist').textContent = data.blacklist.length);
      }
    });

    const blForm = document.getElementById('blacklistForm');
    blForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(blForm);
      const entry = {
        id: 'B' + Math.floor(100 + Math.random()*900),
        name: fd.get('name'),
        mobile: fd.get('mobile'),
        reason: fd.get('reason'),
        addedOn: new Date().toISOString().split('T')[0],
        addedBy: user
      };
      data.blacklist.unshift(entry);
      DVMS.saveData(data);
      renderBlacklist();
      blForm.reset();
      showToast('Added to blacklist', 'success');
    });
  }

  // REPORTS CHARTS
  if (document.getElementById('visitsChart')) {
    const ctx = document.getElementById('visitsChart');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Today'],
        datasets: [{
          label: 'Visitors',
          data: [12,19,15,22,18,9,8],
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79,70,229,0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }
  if (document.getElementById('purposeChart')) {
    const ctx2 = document.getElementById('purposeChart');
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Interview','Meeting','Delivery','Maintenance','Other'],
        datasets: [{ data: [35,25,20,12,8], backgroundColor: ['#4f46e5','#06b6d4','#10b981','#f59e0b','#8b5cf6'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // Toast
  function showToast(msg, type='success') {
    const toast = document.createElement('div');
    const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-slate-800' };
    toast.className = `fixed bottom-6 right-6 ${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 transform translate-y-4 opacity-0 transition-all`;
    toast.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.remove('translate-y-4','opacity-0'); }, 10);
    setTimeout(() => { toast.classList.add('translate-y-4','opacity-0'); setTimeout(()=>toast.remove(),300); }, 3000);
  }
  window.showToast = showToast;
});

// Login handler
function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  if (user && pass) {
    localStorage.setItem('dvms_user', user);
    window.location.href = 'dashboard.html';
  }
}