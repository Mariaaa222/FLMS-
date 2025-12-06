// User Activity Tracking System
(function() {
  'use strict';

  // Initialize
  Auth.requireAuth();
  Database.init();

  // Elements
  const welcomeName = document.getElementById('welcomeName');
  const totalSignups = document.getElementById('totalSignups');
  const totalLogins = document.getElementById('totalLogins');
  const totalUsers = document.getElementById('totalUsers');
  const activeUsers = document.getElementById('activeUsers');
  const filterActivity = document.getElementById('filterActivity');
  const filterRole = document.getElementById('filterRole');
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');
  const searchInput = document.getElementById('searchInput');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const sortBy = document.getElementById('sortBy');
  const allActivitiesBody = document.getElementById('allActivitiesBody');
  const signupsBody = document.getElementById('signupsBody');
  const loginsBody = document.getElementById('loginsBody');
  const usersBody = document.getElementById('usersBody');
  const pagination = document.getElementById('pagination');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const logoutLink = document.getElementById('logoutLink');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogout = document.getElementById('confirmLogout');
  const cancelLogout = document.getElementById('cancelLogout');
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  const exportPDFBtn = document.getElementById('exportPDFBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  let currentPage = 1;
  let currentTab = 'all';
  let filteredData = [];

  // Set welcome name
  const currentUser = Auth.getCurrentUser();
  if (welcomeName && currentUser) {
    welcomeName.textContent = currentUser.name.split(' ')[0] || currentUser.name;
  }

  // Format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format date only
  function formatDateOnly(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Update statistics
  function updateStatistics() {
    const allActivities = Database.getUserActivityLogs();
    const signups = Database.getUserSignups();
    const logins = Database.getUserLogins();
    const users = Database.getUsers();

    // Count active users today
    const today = new Date().toDateString();
    const todayLogins = logins.filter(log => {
      const logDate = new Date(log.timestamp).toDateString();
      return logDate === today;
    });
    const uniqueTodayUsers = new Set(todayLogins.map(log => log.userId));

    totalSignups.textContent = signups.length;
    totalLogins.textContent = logins.length;
    totalUsers.textContent = users.length;
    activeUsers.textContent = uniqueTodayUsers.size;
  }

  // Filter activities
  function filterActivities() {
    let activities = Database.getUserActivityLogs();
    const activityFilter = filterActivity.value;
    const roleFilter = filterRole.value;
    const searchTerm = searchInput.value.toLowerCase();
    const fromDate = dateFrom.value;
    const toDate = dateTo.value;

    activities = activities.filter(activity => {
      if (activityFilter && activity.activityType !== activityFilter) return false;
      if (roleFilter && activity.userRole !== roleFilter) return false;
      if (searchTerm) {
        const matchesSearch = 
          activity.userName.toLowerCase().includes(searchTerm) ||
          activity.userEmail.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      if (fromDate) {
        const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
        if (activityDate < fromDate) return false;
      }
      if (toDate) {
        const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
        if (activityDate > toDate) return false;
      }
      return true;
    });

    // Sort
    const sortValue = sortBy.value;
    activities.sort((a, b) => {
      switch(sortValue) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'name':
          return a.userName.localeCompare(b.userName);
        case 'activity':
          return a.activityType.localeCompare(b.activityType);
        default:
          return 0;
      }
    });

    filteredData = activities;
    return activities;
  }

  // Render all activities
  function renderAllActivities(activities = null) {
    if (!activities) {
      activities = filterActivities();
    }

    if (!activities.length) {
      allActivitiesBody.innerHTML = '<tr><td colspan="6" class="empty-state">No activities found matching your criteria.</td></tr>';
      return;
    }

    allActivitiesBody.innerHTML = activities.map(activity => {
      const activityIcon = activity.activityType === 'signup' 
        ? '<i class="fa-solid fa-user-plus" style="color: #28a745;"></i>' 
        : '<i class="fa-solid fa-sign-in-alt" style="color: #007bff;"></i>';
      const activityLabel = activity.activityType === 'signup' ? 'Signup' : 'Login';
      const roleBadge = activity.userRole === 'admin' 
        ? '<span class="badge badge-admin">Admin</span>' 
        : '<span class="badge badge-teacher">Teacher</span>';

      return `
        <tr>
          <td>${formatDate(activity.timestamp)}</td>
          <td>${activityIcon} ${activityLabel}</td>
          <td><strong>${activity.userName}</strong></td>
          <td>${activity.userEmail}</td>
          <td>${roleBadge}</td>
          <td class="details-cell">
            ${activity.details.rememberMe ? '<span class="detail-tag">Remember Me</span>' : ''}
            ${activity.details.signupMethod ? '<span class="detail-tag">Web Signup</span>' : ''}
            ${activity.details.loginMethod ? '<span class="detail-tag">Web Login</span>' : ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render signups
  function renderSignups() {
    let signups = Database.getUserSignups();
    
    // Apply filters
    const roleFilter = filterRole.value;
    const searchTerm = searchInput.value.toLowerCase();
    const fromDate = dateFrom.value;
    const toDate = dateTo.value;

    signups = signups.filter(signup => {
      if (roleFilter && signup.userRole !== roleFilter) return false;
      if (searchTerm) {
        const matchesSearch = 
          signup.userName.toLowerCase().includes(searchTerm) ||
          signup.userEmail.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      if (fromDate) {
        const signupDate = new Date(signup.timestamp).toISOString().split('T')[0];
        if (signupDate < fromDate) return false;
      }
      if (toDate) {
        const signupDate = new Date(signup.timestamp).toISOString().split('T')[0];
        if (signupDate > toDate) return false;
      }
      return true;
    });

    signups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (!signups.length) {
      signupsBody.innerHTML = '<tr><td colspan="6" class="empty-state">No signups found.</td></tr>';
      return;
    }

    signupsBody.innerHTML = signups.map(signup => {
      const roleBadge = signup.userRole === 'admin' 
        ? '<span class="badge badge-admin">Admin</span>' 
        : '<span class="badge badge-teacher">Teacher</span>';

      return `
        <tr>
          <td>${formatDate(signup.timestamp)}</td>
          <td><strong>${signup.userName}</strong></td>
          <td>${signup.userEmail}</td>
          <td>${roleBadge}</td>
          <td>${signup.details.contactNumber || 'N/A'}</td>
          <td>${signup.details.address || 'N/A'}</td>
        </tr>
      `;
    }).join('');
  }

  // Render logins
  function renderLogins() {
    let logins = Database.getUserLogins();
    
    // Apply filters
    const roleFilter = filterRole.value;
    const searchTerm = searchInput.value.toLowerCase();
    const fromDate = dateFrom.value;
    const toDate = dateTo.value;

    logins = logins.filter(login => {
      if (roleFilter && login.userRole !== roleFilter) return false;
      if (searchTerm) {
        const matchesSearch = 
          login.userName.toLowerCase().includes(searchTerm) ||
          login.userEmail.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      if (fromDate) {
        const loginDate = new Date(login.timestamp).toISOString().split('T')[0];
        if (loginDate < fromDate) return false;
      }
      if (toDate) {
        const loginDate = new Date(login.timestamp).toISOString().split('T')[0];
        if (loginDate > toDate) return false;
      }
      return true;
    });

    logins.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (!logins.length) {
      loginsBody.innerHTML = '<tr><td colspan="6" class="empty-state">No logins found.</td></tr>';
      return;
    }

    loginsBody.innerHTML = logins.map(login => {
      const roleBadge = login.userRole === 'admin' 
        ? '<span class="badge badge-admin">Admin</span>' 
        : '<span class="badge badge-teacher">Teacher</span>';
      const rememberMe = login.details.rememberMe ? 
        '<span class="status-badge status-active">Yes</span>' : 
        '<span class="status-badge status-inactive">No</span>';
      const status = login.details.success !== false ? 
        '<span class="status-badge status-active">Success</span>' : 
        '<span class="status-badge status-inactive">Failed</span>';

      return `
        <tr>
          <td>${formatDate(login.timestamp)}</td>
          <td><strong>${login.userName}</strong></td>
          <td>${login.userEmail}</td>
          <td>${roleBadge}</td>
          <td>${rememberMe}</td>
          <td>${status}</td>
        </tr>
      `;
    }).join('');
  }

  // Render users
  function renderUsers() {
    let users = Database.getUsers();
    const allActivities = Database.getUserActivityLogs();
    const logins = Database.getUserLogins();

    // Apply filters
    const roleFilter = filterRole.value;
    const searchTerm = searchInput.value.toLowerCase();

    users = users.filter(user => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (searchTerm) {
        const matchesSearch = 
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      return true;
    });

    users.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return bDate - aDate;
    });

    if (!users.length) {
      usersBody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found.</td></tr>';
      return;
    }

    usersBody.innerHTML = users.map(user => {
      const roleBadge = user.role === 'admin' 
        ? '<span class="badge badge-admin">Admin</span>' 
        : '<span class="badge badge-teacher">Teacher</span>';
      
      // Get last login
      const userLogins = logins.filter(log => log.userId === user.id);
      const lastLogin = userLogins.length > 0 
        ? formatDate(userLogins.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp)
        : 'Never';
      
      const totalUserLogins = userLogins.length;
      const registrationDate = user.createdAt 
        ? formatDateOnly(user.createdAt) 
        : 'N/A';

      return `
        <tr>
          <td><strong>${user.name}</strong></td>
          <td>${user.email}</td>
          <td>${roleBadge}</td>
          <td>${registrationDate}</td>
          <td>${lastLogin}</td>
          <td><span class="login-count">${totalUserLogins}</span></td>
          <td><span class="status-badge status-active">Active</span></td>
        </tr>
      `;
    }).join('');
  }

  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update active states
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      
      currentTab = tab;
      
      // Render appropriate content
      switch(tab) {
        case 'all':
          renderAllActivities();
          break;
        case 'signups':
          renderSignups();
          break;
        case 'logins':
          renderLogins();
          break;
        case 'users':
          renderUsers();
          break;
      }
    });
  });

  // Event listeners
  filterActivity.addEventListener('change', () => {
    if (currentTab === 'all') renderAllActivities();
  });

  filterRole.addEventListener('change', () => {
    switch(currentTab) {
      case 'all':
        renderAllActivities();
        break;
      case 'signups':
        renderSignups();
        break;
      case 'logins':
        renderLogins();
        break;
      case 'users':
        renderUsers();
        break;
    }
  });

  searchInput.addEventListener('input', () => {
    switch(currentTab) {
      case 'all':
        renderAllActivities();
        break;
      case 'signups':
        renderSignups();
        break;
      case 'logins':
        renderLogins();
        break;
      case 'users':
        renderUsers();
        break;
    }
  });

  dateFrom.addEventListener('change', () => {
    switch(currentTab) {
      case 'all':
        renderAllActivities();
        break;
      case 'signups':
        renderSignups();
        break;
      case 'logins':
        renderLogins();
        break;
    }
  });

  dateTo.addEventListener('change', () => {
    switch(currentTab) {
      case 'all':
        renderAllActivities();
        break;
      case 'signups':
        renderSignups();
        break;
      case 'logins':
        renderLogins();
        break;
    }
  });

  sortBy.addEventListener('change', () => {
    if (currentTab === 'all') renderAllActivities();
  });

  clearFiltersBtn.addEventListener('click', () => {
    filterActivity.value = '';
    filterRole.value = '';
    searchInput.value = '';
    dateFrom.value = '';
    dateTo.value = '';
    sortBy.value = 'newest';
    
    switch(currentTab) {
      case 'all':
        renderAllActivities();
        break;
      case 'signups':
        renderSignups();
        break;
      case 'logins':
        renderLogins();
        break;
      case 'users':
        renderUsers();
        break;
    }
  });

  refreshBtn.addEventListener('click', () => {
    updateStatistics();
    switch(currentTab) {
      case 'all':
        renderAllActivities();
        break;
      case 'signups':
        renderSignups();
        break;
      case 'logins':
        renderLogins();
        break;
      case 'users':
        renderUsers();
        break;
    }
  });

  // Export functions
  exportExcelBtn.addEventListener('click', () => {
    let data = [];
    let headers = [];
    
    switch(currentTab) {
      case 'all':
        headers = ['Date & Time', 'Activity', 'User Name', 'Email', 'Role', 'Details'];
        data = filteredData.map(a => [
          formatDate(a.timestamp),
          a.activityType,
          a.userName,
          a.userEmail,
          a.userRole,
          JSON.stringify(a.details)
        ]);
        break;
      case 'signups':
        headers = ['Signup Date', 'User Name', 'Email', 'Role', 'Contact', 'Address'];
        const signups = Database.getUserSignups();
        data = signups.map(s => [
          formatDate(s.timestamp),
          s.userName,
          s.userEmail,
          s.userRole,
          s.details.contactNumber || 'N/A',
          s.details.address || 'N/A'
        ]);
        break;
      case 'logins':
        headers = ['Login Date & Time', 'User Name', 'Email', 'Role', 'Remember Me', 'Status'];
        const logins = Database.getUserLogins();
        data = logins.map(l => [
          formatDate(l.timestamp),
          l.userName,
          l.userEmail,
          l.userRole,
          l.details.rememberMe ? 'Yes' : 'No',
          l.details.success !== false ? 'Success' : 'Failed'
        ]);
        break;
      case 'users':
        headers = ['User Name', 'Email', 'Role', 'Registration Date', 'Last Login', 'Total Logins'];
        const users = Database.getUsers();
        const allLogins = Database.getUserLogins();
        data = users.map(u => {
          const userLogins = allLogins.filter(log => log.userId === u.id);
          const lastLogin = userLogins.length > 0 
            ? formatDate(userLogins.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp)
            : 'Never';
          return [
            u.name,
            u.email,
            u.role,
            u.createdAt ? formatDateOnly(u.createdAt) : 'N/A',
            lastLogin,
            userLogins.length
          ];
        });
        break;
    }

    let csv = headers.join(',') + '\n';
    data.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-tracking-${currentTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  });

  exportPDFBtn.addEventListener('click', () => {
    window.print();
  });

  // Logout
  logoutLink.addEventListener('click', e => {
    e.preventDefault();
    logoutModal.style.display = 'flex';
  });

  confirmLogout.addEventListener('click', () => {
    Auth.logout();
    window.location.href = 'login.html';
  });

  cancelLogout.addEventListener('click', () => {
    logoutModal.style.display = 'none';
  });

  window.onclick = e => {
    if (e.target === logoutModal) logoutModal.style.display = 'none';
  };

  // Initialize
  updateStatistics();
  renderAllActivities();
})();

