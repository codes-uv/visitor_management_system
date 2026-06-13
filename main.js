// Main JS for DVMS v3 - with Pass ID, Edit, Overstay, Colorful Popups
(function() {
  const saved = localStorage.getItem('dvms_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) document.documentElement.classList.add('dark');
})();

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('dvms_theme', isDark ? 'dark' : 'light');
  updateThemeIcons();
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

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes/60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function getOverstay(checkIn, expectedDuration) {
  const now = new Date();
  const inTime = new Date(checkIn);
  const expectedOut = new Date(inTime.getTime() + expectedDuration * 60000);
  if (now > expectedOut) {
    const overstayMs = now - expectedOut;
    const overstayMin = Math.floor(overstayMs / 60000);
    return overstayMin;
  }
  return 0;
}

// COLORFUL CONFIRM POPUP
function showConfirm(title, message, details, onConfirm, type='warning') {
  const icons = {
    warning: '<svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
    danger: '<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
    info: '<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };
  const colors = {
    warning: 'bg-amber-100 dark:bg-amber-950',
    danger: 'bg-red-100 dark:bg-red-950',
    info: 'bg-indigo-100 dark:bg-indigo-950'
  };
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 transform scale-95 opacity-0 transition-all duration-200" id="confirmBox">
      <div class="p-6">
        <div class="w-12 h-12 rounded-2xl ${colors[type]} flex items-center justify-center mb-4">
          ${icons[type]}
        </div>
        <h3 class="text-xl font-bold mb-2 text-slate-900 dark:text-white">${title}</h3>
        <p class="text-slate-600 dark:text-slate-400 mb-4">${message}</p>
        ${details ? `<div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-sm space-y-1.5 mb-5 border border-slate-200 dark:border-slate-700">${details}</div>` : ''}
        <div class="flex gap-3">
          <button id="confirmCancel" class="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button id="confirmOk" class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition-colors">Confirm</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => {
    document.getElementById('confirmBox').classList.remove('scale-95', 'opacity-0');
  }, 10);
  
  modal.querySelector('#confirmCancel').onclick = () => {
    document.getElementById('confirmBox').classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.remove(), 200);
  };
  modal.querySelector('#confirmOk').onclick = () => {
    document.getElementById('confirmBox').classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.remove(); onConfirm(); }, 200);
  };
  modal.onclick = (e) => { if (e.target === modal) modal.querySelector('#confirmCancel').click(); };
}
window.showConfirm = showConfirm;

document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcons();
  const isLoginPage = window.location.pathname.includes('login.html');
  const user = localStorage.getItem('dvms_user');
  if (!isLoginPage && !user) { window.location.href = 'login.html'; return; }
  if (isLoginPage && user) { window.location.href = 'dashboard.html'; return; }

  const data = DVMS.getData();

  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    sidebarOverlay.classList.toggle('hidden');
  });
  sidebarOverlay?.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  });

  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('dvms_user');
      window.location.href = 'login.html';
    });
  });
  document.querySelectorAll('[data-username]').forEach(el => el.textContent = user || 'Admin');

  if (document.getElementById('statsGrid')) {
    const today = DVMS.today();
    const todayVisitors = data.visitors.filter(v => v.checkIn.startsWith(today));
    const activeVisitors = data.visitors.filter(v => v.status === 'active');
    const completedToday = todayVisitors.filter(v => v.status === 'completed');
    const overstays = activeVisitors.filter(v => getOverstay(v.checkIn, v.expectedDuration) > 0);
    
    document.getElementById('statToday').textContent = todayVisitors.length;
    document.getElementById('statActive').textContent = activeVisitors.length;
    document.getElementById('statCompleted').textContent = completedToday.length;
    document.getElementById('statBlacklist').textContent = data.blacklist.length;

    const statsGrid = document.getElementById('statsGrid');
    if (overstays.length > 0 && !document.getElementById('overstayAlert')) {
      const alert = document.createElement('div');
      alert.id = 'overstayAlert';
      alert.className = 'sm:col-span-2 xl:col-span-4 bg-amber-50 mb-[1.5rem] dark:bg-amber-950/30 border border-amber-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between';
      alert.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <p class="font-medium text-amber-900 dark:text-amber-100">${overstays.length} Visitor(s) Overstaying</p>
            <p class="text-sm text-amber-700 dark:text-amber-300">${overstays.map(v => `${v.name} (+${formatDuration(getOverstay(v.checkIn, v.expectedDuration))})`).join(', ')}</p>
          </div>
        </div>
        <a href="visitors.html" class="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline">View →</a>
      `;
      statsGrid.parentNode.insertBefore(alert, statsGrid.nextSibling);
    }

    const recentTbody = document.getElementById('recentVisitors');
    if (recentTbody) {
      recentTbody.innerHTML = todayVisitors.slice(0,5).map(v => {
        const overstay = v.status === 'active' ? getOverstay(v.checkIn, v.expectedDuration) : 0;
        return `
        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="py-3 px-4">
            <div>
              <p class="font-medium text-slate-800 dark:text-slate-200">${v.name}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">${v.passId}</p>
            </div>
          </td>
          <td class="py-3 px-4 text-sm">${v.personToMeet}</td>
          <td class="py-3 px-4 text-sm">${v.purpose}</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full text-xs font-medium ${v.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300':'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}">
                ${v.status}
              </span>
              ${overstay > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">+${formatDuration(overstay)}</span>` : ''}
            </div>
          </td>
          <td class="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">${new Date(v.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
        </tr>
      `}).join('');
    }
  }

  const addForm = document.getElementById('addVisitorForm');
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(addForm);
      const visitor = {
        id: DVMS.generateId(),
        passId: DVMS.generatePassId(),
        name: fd.get('name').trim(),
        mobile: fd.get('mobile').trim(),
        address: fd.get('address').trim(),
        purpose: fd.get('purpose'),
        personToMeet: fd.get('person').trim(),
        expectedDuration: parseInt(fd.get('duration')) || 60,
        checkIn: new Date().toISOString(),
        checkOut: null,
        status: 'active',
        photo: `https://i.pravatar.cc/150?u=${Date.now()}`,
        visitHistory: []
      };
      visitor.visitHistory.push({ checkIn: visitor.checkIn, checkOut: null, purpose: visitor.purpose, duration: visitor.expectedDuration });

      let valid = true;
      addForm.querySelectorAll('[required]').forEach(input => {
        const error = input.parentElement.querySelector('.error-msg');
        if (!input.value.trim()) {
          valid = false;
          input.classList.add('border-red-500');
          error?.classList.remove('hidden');
        } else {
          input.classList.remove('border-red-500');
          error?.classList.add('hidden');
        }
      });
      
      if (!/^[6-9]\d{9}$/.test(visitor.mobile)) {
        valid = false;
        showToast('Enter valid 10-digit mobile', 'error');
      }

      if (data.blacklist.some(b => b.mobile === visitor.mobile)) {
        showToast('Visitor is blacklisted!', 'error');
        return;
      }
      if (!valid) return;

      data.visitors.unshift(visitor);
      DVMS.saveData(data);
      showToast(`Checked-in! Pass: ${visitor.passId}`, 'success');
      addForm.reset();
      setTimeout(() => window.location.href = 'visitors.html', 1000);
    });
  }

  const visitorsTable = document.getElementById('visitorsTable');
  if (visitorsTable) {
    let filtered = [...data.visitors];
    let currentPage = 1;
    const perPage = 10;

    const searchInput = document.getElementById('searchVisitor');
    const statusFilter = document.getElementById('statusFilter');

    function renderTable() {
      const start = (currentPage - 1) * perPage;
      const pageData = filtered.slice(start, start + perPage);
      
      visitorsTable.innerHTML = pageData.map(v => {
        const overstay = v.status === 'active' ? getOverstay(v.checkIn, v.expectedDuration) : 0;
        const duration = v.checkOut ? Math.floor((new Date(v.checkOut) - new Date(v.checkIn))/60000) : Math.floor((Date.now() - new Date(v.checkIn))/60000);
        const checkInTime = new Date(v.checkIn).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'});
        const checkOutTime = v.checkOut ? new Date(v.checkOut).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}) : '-';
        
        return `
        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="py-3 px-4 lg:px-6">
            <p class="font-medium text-slate-800 dark:text-slate-200">${v.name}</p>
          </td>
          <td class="py-3 px-4">
            <span class="text-xs font-mono px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded">${v.passId}</span>
          </td>
          <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">${v.mobile}</td>
          <td class="py-3 px-4 text-sm hidden md:table-cell">
            <span class="px-2 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800">${v.purpose}</span>
          </td>
          <td class="py-3 px-4 text-sm hidden lg:table-cell">${v.personToMeet}</td>
          <td class="py-3 px-4 text-sm">
            <div>
              <p class="font-medium text-slate-700 dark:text-slate-300">${checkInTime}</p>
              <p class="text-xs text-slate-500">${formatDuration(duration)}</p>
            </div>
          </td>
          <td class="py-3 px-4 text-sm">
            ${v.checkOut ? `<p class="font-medium text-emerald-600 dark:text-emerald-400">${checkOutTime}</p>` : `<p class="text-slate-400">—</p>`}
          </td>
          <td class="py-3 px-4">
            <div class="flex flex-col gap-1">
              <span class="px-2.5 py-1 rounded-full text-xs font-medium w-fit ${v.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300':'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}">
                ${v.status}
              </span>
              ${overstay > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 w-fit">OVERSTAY +${formatDuration(overstay)}</span>` : ''}
            </div>
          </td>
          <td class="py-3 px-4 lg:px-6">
            <div class="flex items-center justify-end gap-1">
              <button data-view="${v.id}" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400" title="View History">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
              <button data-edit="${v.id}" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400" title="Edit">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              ${v.status==='active' ? `<button data-exit="${v.id}" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg text-red-600 dark:text-red-400" title="Check Out">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>` : `<button data-delete="${v.id}" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400" title="Delete Record">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>`}
            </div>
          </td>
        </tr>
      `}).join('');

      const totalPages = Math.ceil(filtered.length / perPage);
      document.getElementById('paginationInfo').textContent = `Showing ${start+1}-${Math.min(start+perPage, filtered.length)} of ${filtered.length}`;
      document.getElementById('prevPage').disabled = currentPage === 1;
      document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
    }

    function applyFilters() {
      const q = searchInput.value.toLowerCase();
      const status = statusFilter.value;
      filtered = data.visitors.filter(v => {
        const matches = v.name.toLowerCase().includes(q) || v.mobile.includes(q) || v.passId.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
        const matchesStatus = status === 'all' || v.status === status;
        return matches && matchesStatus;
      });
      currentPage = 1;
      renderTable();
    }

    searchInput?.addEventListener('input', applyFilters);
    statusFilter?.addEventListener('change', applyFilters);
    document.getElementById('prevPage')?.addEventListener('click', () => { if (currentPage>1) {currentPage--; renderTable();}});
    document.getElementById('nextPage')?.addEventListener('click', () => { const total = Math.ceil(filtered.length/perPage); if (currentPage<total) {currentPage++; renderTable();}});

    visitorsTable.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('[data-view]');
      const exitBtn = e.target.closest('[data-exit]');
      const editBtn = e.target.closest('[data-edit]');
      const delBtn = e.target.closest('[data-delete]');
      
      if (viewBtn) openVisitorModal(viewBtn.dataset.view);
      if (exitBtn) {
        const v = data.visitors.find(x => x.id === exitBtn.dataset.exit);
        if (v) {
          const duration = Math.floor((Date.now() - new Date(v.checkIn))/60000);
          showConfirm(
            'Check Out Visitor?',
            `Are you sure you want to check out this visitor?`,
            `<div class="space-y-1.5">
              <div class="flex justify-between"><span class="text-slate-500">Name:</span><span class="font-medium">${v.name}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Pass ID:</span><span class="font-mono text-indigo-600">${v.passId}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Check-in:</span><span>${new Date(v.checkIn).toLocaleString('en-IN')}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Duration:</span><span class="font-medium">${formatDuration(duration)}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Purpose:</span><span>${v.purpose}</span></div>
            </div>`,
            () => {
              v.status = 'completed';
              v.checkOut = new Date().toISOString();
              const lastVisit = v.visitHistory[v.visitHistory.length - 1];
              if (lastVisit && !lastVisit.checkOut) lastVisit.checkOut = v.checkOut;
              DVMS.saveData(data);
              showToast(`${v.name} checked out successfully`, 'success');
              applyFilters();
            },
            'warning'
          );
        }
      }
      if (editBtn) openEditModal(editBtn.dataset.edit);
      if (delBtn) {
        const v = data.visitors.find(x => x.id === delBtn.dataset.delete);
        showConfirm(
          'Delete Record?',
          'This action cannot be undone. The visitor record will be permanently deleted.',
          v ? `<div class="space-y-1.5"><div class="flex justify-between"><span class="text-slate-500">Name:</span><span class="font-medium">${v.name}</span></div><div class="flex justify-between"><span class="text-slate-500">Pass ID:</span><span class="font-mono">${v.passId}</span></div></div>` : '',
          () => {
            data.visitors = data.visitors.filter(x => x.id !== delBtn.dataset.delete);
            DVMS.saveData(data);
            showToast('Record deleted permanently', 'success');
            applyFilters();
          },
          'danger'
        );
      }
    });

    renderTable();
    setInterval(renderTable, 60000);
  }

  window.openVisitorModal = function(id) {
    const v = data.visitors.find(x => x.id === id);
    if (!v) return;
    const modal = document.getElementById('visitorModal');
    const content = document.getElementById('visitorModalContent');
    const overstay = v.status === 'active' ? getOverstay(v.checkIn, v.expectedDuration) : 0;
    
    content.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
          ${v.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
        </div>
        <div class="flex-1">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-xl font-semibold">${v.name}</h3>
              <p class="text-slate-500 dark:text-slate-400">${v.mobile} • ${v.address}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">${v.passId}</span>
                <span class="px-2.5 py-1 rounded-full text-xs font-medium ${v.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300':'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}">${v.status.toUpperCase()}</span>
                ${overstay > 0 ? `<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">OVERSTAY +${formatDuration(overstay)}</span>` : ''}
              </div>
            </div>
            <button onclick="document.getElementById('visitorModal').classList.add('hidden')" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl"><p class="text-xs text-slate-500">Purpose</p><p class="font-medium">${v.purpose}</p></div>
        <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl"><p class="text-xs text-slate-500">Host</p><p class="font-medium">${v.personToMeet}</p></div>
        <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl"><p class="text-xs text-slate-500">Expected</p><p class="font-medium">${formatDuration(v.expectedDuration)}</p></div>
        <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl"><p class="text-xs text-slate-500">Visits</p><p class="font-medium">${v.visitHistory.length}</p></div>
      </div>

      <div class="mt-6">
        <h4 class="font-semibold mb-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Check-In / Check-Out History
        </h4>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          ${v.visitHistory.slice().reverse().map((visit, idx) => {
            const inTime = new Date(visit.checkIn);
            const outTime = visit.checkOut ? new Date(visit.checkOut) : null;
            const dur = outTime ? Math.floor((outTime - inTime)/60000) : Math.floor((Date.now() - inTime)/60000);
            return `
            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-medium">${v.visitHistory.length - idx}</div>
                <div>
                  <p class="text-sm font-medium">${inTime.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})} • ${visit.purpose}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">In: ${inTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} ${outTime ? `• Out: ${outTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : '• Still inside'}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium">${formatDuration(dur)}</p>
                <p class="text-xs ${outTime ? 'text-emerald-600' : 'text-amber-600'}">${outTime ? 'Completed' : 'Active'}</p>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  };

  window.openEditModal = function(id) {
    const v = data.visitors.find(x => x.id === id);
    if (!v) return;
    
    const modal = document.getElementById('visitorModal');
    const content = document.getElementById('visitorModalContent');
    
    content.innerHTML = `
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold">Edit Visitor Record</h3>
        <button onclick="document.getElementById('visitorModal').classList.add('hidden')" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <form id="editForm" class="space-y-4">
        <input type="hidden" name="id" value="${v.id}">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="text-sm font-medium">Pass ID</label><input value="${v.passId}" disabled class="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-sm"></div>
          <div><label class="text-sm font-medium">Status</label><select name="status" class="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950"><option ${v.status==='active'?'selected':''} value="active">Active</option><option ${v.status==='completed'?'selected':''} value="completed">Completed</option></select></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="text-sm font-medium">Name *</label><input name="name" value="${v.name}" required class="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950"></div>
          <div><label class="text-sm font-medium">Mobile *</label><input name="mobile" value="${v.mobile}" required class="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950"></div>
        </div>
        <div><label class="text-sm font-medium">Address</label><input name="address" value="${v.address}" class="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950"></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label class="text-sm font-medium">Purpose</label><select name="purpose" class="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950"><option ${v.purpose==='Interview'?'selected':''}>Interview</option><option ${v.purpose==='Client Meeting'?'selected':''}>Client Meeting</option><option ${v.purpose==='Delivery'?'selected':''}>Delivery</option><option ${v.purpose==='Maintenance'?'selected':''}>Maintenance</option><option ${v.purpose==='Vendor Discussion'?'selected':''}>Vendor Discussion</option><option ${v.purpose==='Personal'?'selected':''}>Personal</option><option ${v.purpose==='Guest'?'selected':''}>Guest</option><option ${v.purpose==='Audit'?'selected':''}>Audit</option></select></div>
          <div><label class="text-sm font-medium">Person to Meet</label><input name="person" value="${v.personToMeet}" class="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950"></div>
          <div><label class="text-sm font-medium">Duration</label><select name="duration" class="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950"><option value="30" ${v.expectedDuration==30?'selected':''}>30 min</option><option value="60" ${v.expectedDuration==60?'selected':''}>1 hour</option><option value="120" ${v.expectedDuration==120?'selected':''}>2 hours</option><option value="240" ${v.expectedDuration==240?'selected':''}>4 hours</option><option value="480" ${v.expectedDuration==480?'selected':''}>8 hours</option></select></div>
        </div>
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">Save Changes</button>
          <button type="button" onclick="document.getElementById('visitorModal').classList.add('hidden')" class="px-6 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl">Cancel</button>
        </div>
      </form>
    `;
    modal.classList.remove('hidden');
    
    document.getElementById('editForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      v.name = fd.get('name');
      v.mobile = fd.get('mobile');
      v.address = fd.get('address');
      v.purpose = fd.get('purpose');
      v.personToMeet = fd.get('person');
      v.expectedDuration = parseInt(fd.get('duration'));
      v.status = fd.get('status');
      if (v.status === 'completed' && !v.checkOut) v.checkOut = new Date().toISOString();
      if (v.status === 'active' && v.checkOut) v.checkOut = null;
      
      DVMS.saveData(data);
      showToast('Visitor record updated', 'success');
      modal.classList.add('hidden');
      location.reload();
    });
  };

  const blacklistTable = document.getElementById('blacklistTable');
  if (blacklistTable) {
    function renderBlacklist() {
      blacklistTable.innerHTML = data.blacklist.map(b => `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="py-3 px-4"><p class="font-medium">${b.name}</p><p class="text-xs text-slate-500 dark:text-slate-400">${b.id}</p></td>
          <td class="py-3 px-4 text-sm">${b.mobile}</td>
          <td class="py-3 px-4 text-sm max-w-xs truncate">${b.reason}</td>
          <td class="py-3 px-4 text-sm hidden md:table-cell">${b.addedOn}</td>
          <td class="py-3 px-4"><button data-remove="${b.id}" class="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 rounded-lg">Remove</button></td>
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
      }
    });
  }

  if (document.getElementById('visitsChart')) {
    new Chart(document.getElementById('visitsChart'), {
      type: 'line',
      data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Today'], datasets: [{ label: 'Visitors', data: [12,19,15,22,18,9,8], borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.1)', tension: 0.4, fill: true }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }

  window.showToast = function(msg, type='success') {
    const toast = document.createElement('div');
    const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-slate-800' };
    toast.className = `fixed bottom-6 right-6 ${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg z-50 transform translate-y-4 opacity-0 transition-all`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-4','opacity-0'), 10);
    setTimeout(() => { toast.classList.add('translate-y-4','opacity-0'); setTimeout(()=>toast.remove(),300); }, 3000);
  };
});

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('username').value;
  if (user) {
    localStorage.setItem('dvms_user', user);
    window.location.href = 'dashboard.html';
  }
}