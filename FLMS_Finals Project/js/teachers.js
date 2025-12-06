// Teachers Management System
(function() {
  'use strict';

  // Initialize
  Auth.requireAuth();
  Database.init();

  // Elements
  const teacherTableBody = document.getElementById("teacherTableBody");
  const modal = document.getElementById("teacherModal");
  const deleteModal = document.getElementById("deleteModal");
  const profileModal = document.getElementById("profileModal");
  const modalTitle = document.getElementById("modalTitle");
  const addTeacherBtn = document.getElementById("addTeacherBtn");
  const closeBtn = document.querySelector(".close");
  const teacherForm = document.getElementById("teacherForm");
  const deleteTeacherName = document.getElementById("deleteTeacherName");
  const confirmDelete = document.getElementById("confirmDelete");
  const cancelDelete = document.getElementById("cancelDelete");
  const welcomeName = document.getElementById("welcomeName");
  const searchInput = document.getElementById("searchInput");
  const filterDepartment = document.getElementById("filterDepartment");
  const filterStatus = document.getElementById("filterStatus");
  const filterEmployment = document.getElementById("filterEmployment");
  const filterAcademicYear = document.getElementById("filterAcademicYear");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const sortBy = document.getElementById("sortBy");
  const itemsPerPage = document.getElementById("itemsPerPage");
  const tableCount = document.getElementById("tableCount");
  const pagination = document.getElementById("pagination");
  const messageAlert = document.getElementById("messageAlert");
  const logoutLink = document.getElementById("logoutLink");
  const logoutModal = document.getElementById("logoutModal");
  const confirmLogout = document.getElementById("confirmLogout");
  const cancelLogout = document.getElementById("cancelLogout");
  const exportExcelBtn = document.getElementById("exportExcelBtn");
  const exportCSVBtn = document.getElementById("exportCSVBtn");
  const exportPDFBtn = document.getElementById("exportPDFBtn");
  const printBtn = document.getElementById("printBtn");

  let editId = null;
  let deleteId = null;
  let currentPage = 1;
  let filteredTeachers = [];
  let currentUser = Auth.getCurrentUser();

  // Set welcome name
  if (welcomeName && currentUser) {
    welcomeName.textContent = currentUser.name.split(' ')[0] || currentUser.name;
  }

  // Show message
  function showMessage(text, type = 'success') {
    messageAlert.textContent = text;
    messageAlert.className = `message-alert ${type}`;
    messageAlert.style.display = 'block';
    setTimeout(() => {
      messageAlert.style.display = 'none';
    }, 4000);
  }

  // Get load status color
  function getLoadStatus(units) {
    if (units === 0) return { color: '#6c757d', label: 'No Load', icon: 'fa-circle' };
    if (units < 6) return { color: '#ffc107', label: 'Underloaded', icon: 'fa-exclamation-triangle' };
    if (units <= 15) return { color: '#28a745', label: 'Normal Load', icon: 'fa-check-circle' };
    return { color: '#dc3545', label: 'Overloaded', icon: 'fa-exclamation-circle' };
  }

  // Get status badge class
  function getStatusClass(status) {
    const statusMap = {
      'Active': 'status-active',
      'Inactive': 'status-inactive',
      'On Leave': 'status-leave',
      'Resigned': 'status-resigned'
    };
    return statusMap[status] || 'status-inactive';
  }

  // Render table
  function renderTable(teachers = null) {
    if (!teachers) {
      teachers = Database.getTeachers();
    }

    filteredTeachers = teachers;
    const total = teachers.length;
    tableCount.textContent = total;

    if (!total) {
      teacherTableBody.innerHTML = '<tr><td colspan="8" class="empty-state">No teachers found matching your criteria.</td></tr>';
      pagination.innerHTML = '';
      return;
    }

    // Pagination
    const perPage = itemsPerPage.value === 'all' ? total : parseInt(itemsPerPage.value);
    const totalPages = Math.ceil(total / perPage);
    currentPage = Math.min(currentPage, totalPages || 1);

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageTeachers = teachers.slice(start, end);

    // Render rows
    teacherTableBody.innerHTML = pageTeachers.map(teacher => {
      const loadStatus = getLoadStatus(teacher.units || 0);
      const statusClass = getStatusClass(teacher.status || 'Active');
      const assignedSubjects = (teacher.assignedSubjects || []).join(', ') || 'None';
      
      return `
        <tr>
          <td><strong>${teacher.name}</strong></td>
          <td>${teacher.rank || '-'}</td>
          <td>${teacher.department || '-'}</td>
          <td>${teacher.email}</td>
          <td>${teacher.contactNumber || '-'}</td>
          <td class="units-cell">
            <span class="units-value" style="color: ${loadStatus.color}">
              <i class="fa-solid ${loadStatus.icon}"></i> ${teacher.units || 0}
            </span>
            <small class="load-label" style="color: ${loadStatus.color}">${loadStatus.label}</small>
          </td>
          <td><span class="status-badge ${statusClass}">${teacher.status || 'Active'}</span></td>
          <td class="actions-cell">
            <button class="btn-action btn-view" onclick="viewTeacher('${teacher.id}')" title="View Profile">
              <i class="fa-solid fa-eye"></i> View
            </button>
            <button class="btn-action btn-edit" onclick="editTeacher('${teacher.id}')" title="Edit Teacher">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn-action btn-delete" onclick="deleteTeacher('${teacher.id}')" title="Delete Teacher">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Render pagination
    if (totalPages > 1) {
      let paginationHTML = '<div class="pagination-controls">';
      if (currentPage > 1) {
        paginationHTML += `<button onclick="goToPage(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i> Previous</button>`;
      }
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
          paginationHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
          paginationHTML += `<span>...</span>`;
        }
      }
      if (currentPage < totalPages) {
        paginationHTML += `<button onclick="goToPage(${currentPage + 1})">Next <i class="fa-solid fa-chevron-right"></i></button>`;
      }
      paginationHTML += '</div>';
      pagination.innerHTML = paginationHTML;
    } else {
      pagination.innerHTML = '';
    }
  }

  // Filter and sort
  function applyFilters() {
    let teachers = Database.getTeachers();
    const searchTerm = searchInput.value.toLowerCase();
    const deptFilter = filterDepartment.value;
    const statusFilter = filterStatus.value;
    const empFilter = filterEmployment.value;
    const yearFilter = filterAcademicYear.value;

    teachers = teachers.filter(teacher => {
      if (searchTerm) {
        const matchesSearch = 
          teacher.name.toLowerCase().includes(searchTerm) ||
          teacher.email.toLowerCase().includes(searchTerm) ||
          (teacher.department && teacher.department.toLowerCase().includes(searchTerm)) ||
          (teacher.specialization && teacher.specialization.toLowerCase().includes(searchTerm)) ||
          (teacher.assignedSubjects && teacher.assignedSubjects.some(s => s.toLowerCase().includes(searchTerm)));
        if (!matchesSearch) return false;
      }
      if (deptFilter && teacher.department !== deptFilter) return false;
      if (statusFilter && (teacher.status || 'Active') !== statusFilter) return false;
      if (empFilter && (teacher.employmentStatus || 'Full-time') !== empFilter) return false;
      if (yearFilter && (teacher.academicYear || '2025-2026') !== yearFilter) return false;
      return true;
    });

    // Sort
    const sortValue = sortBy.value;
    teachers.sort((a, b) => {
      switch(sortValue) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'units':
          return (a.units || 0) - (b.units || 0);
        case 'units-desc':
          return (b.units || 0) - (a.units || 0);
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        case 'status':
          return (a.status || 'Active').localeCompare(b.status || 'Active');
        default:
          return 0;
      }
    });

    currentPage = 1;
    renderTable(teachers);
  }

  // Open modal
  function openModal(mode, id = null) {
    modal.style.display = "flex";
    if (mode === "add") {
      modalTitle.textContent = "Add New Teacher";
      teacherForm.reset();
      editId = null;
      document.getElementById("teacherStatus").value = "Active";
    } else if (mode === "edit" && id) {
      modalTitle.textContent = "Edit Teacher";
      const teacher = Database.getTeachers().find(t => t.id === id);
      if (!teacher) return;
      document.getElementById("teacherName").value = teacher.name || '';
      document.getElementById("teacherEmail").value = teacher.email || '';
      document.getElementById("teacherUnits").value = teacher.units || 0;
      document.getElementById("teacherRank").value = teacher.rank || '';
      document.getElementById("teacherDepartment").value = teacher.department || '';
      document.getElementById("teacherSpecialization").value = teacher.specialization || '';
      document.getElementById("teacherEmploymentStatus").value = teacher.employmentStatus || 'Full-time';
      document.getElementById("teacherContact").value = teacher.contactNumber || '';
      document.getElementById("teacherOfficeHours").value = teacher.officeHours || '';
      document.getElementById("teacherStatus").value = teacher.status || 'Active';
      document.getElementById("teacherAcademicYear").value = teacher.academicYear || '2025-2026';
      document.getElementById("teacherSemester").value = teacher.semester || '1st Semester';
      editId = id;
    }
  }

  function closeModal() {
    modal.style.display = "none";
    document.getElementById("emailError").textContent = '';
  }

  // Form validation
  function validateEmail(email) {
    const existing = Database.getTeachers().find(t => t.email.toLowerCase() === email.toLowerCase() && t.id !== editId);
    return !existing;
  }

  // Form submit
  teacherForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("teacherEmail").value.trim();
    
    if (!validateEmail(email)) {
      document.getElementById("emailError").textContent = 'This email is already registered.';
      showMessage('Email already exists. Please use a different email.', 'error');
      return;
    }

    const newTeacher = {
      name: document.getElementById("teacherName").value.trim(),
      email: email,
      units: Number(document.getElementById("teacherUnits").value) || 0,
      rank: document.getElementById("teacherRank").value,
      department: document.getElementById("teacherDepartment").value,
      specialization: document.getElementById("teacherSpecialization").value.trim(),
      employmentStatus: document.getElementById("teacherEmploymentStatus").value,
      contactNumber: document.getElementById("teacherContact").value.trim(),
      officeHours: document.getElementById("teacherOfficeHours").value.trim(),
      status: document.getElementById("teacherStatus").value,
      academicYear: document.getElementById("teacherAcademicYear").value,
      semester: document.getElementById("teacherSemester").value,
      assignedSubjects: [],
      createdAt: new Date().toISOString()
    };

    if (!newTeacher.name || !newTeacher.email) {
      showMessage('Please fill in all required fields.', 'error');
      return;
    }

    if (editId) {
      Database.updateTeacher(editId, newTeacher);
      Database.addAuditLog('update', 'teacher', editId, currentUser?.id, currentUser?.name, { field: 'teacher_info' });
      showMessage('Teacher updated successfully!', 'success');
    } else {
      const added = Database.addTeacher(newTeacher);
      Database.addAuditLog('create', 'teacher', added.id, currentUser?.id, currentUser?.name, { field: 'teacher_info' });
      showMessage('Teacher added successfully!', 'success');
    }

    applyFilters();
    closeModal();
  });

  // View teacher profile
  window.viewTeacher = function(id) {
    const teacher = Database.getTeachers().find(t => t.id === id);
    if (!teacher) return;

    // Get assigned subjects
    const subjects = Database.getSubjects().filter(s => 
      teacher.assignedSubjects && teacher.assignedSubjects.includes(s.code)
    );
    
    // Get schedules
    const schedules = Database.getSchedules().filter(s => s.instructor === teacher.name);

    document.getElementById("profileName").textContent = teacher.name;
    document.getElementById("profileRank").textContent = teacher.rank || '-';
    document.getElementById("profileDepartment").textContent = teacher.department || '-';
    document.getElementById("profileEmail").textContent = teacher.email;
    document.getElementById("profileContact").textContent = teacher.contactNumber || 'Not provided';
    document.getElementById("profileEmployment").textContent = teacher.employmentStatus || '-';
    document.getElementById("profileOfficeHours").textContent = teacher.officeHours || 'Not specified';
    document.getElementById("profileSpecialization").textContent = teacher.specialization || 'Not specified';
    document.getElementById("profileStatus").textContent = teacher.status || 'Active';
    document.getElementById("profileStatus").className = `status-badge ${getStatusClass(teacher.status || 'Active')}`;
    document.getElementById("profileUnits").textContent = teacher.units || 0;
    document.getElementById("profileUnits").style.color = getLoadStatus(teacher.units || 0).color;
    document.getElementById("profileAcademicYear").textContent = teacher.academicYear || '-';
    document.getElementById("profileSemester").textContent = teacher.semester || '-';
    
    if (subjects.length) {
      document.getElementById("profileSubjects").innerHTML = subjects.map(s => 
        `<div class="subject-tag">${s.code} - ${s.title}</div>`
      ).join('');
    } else {
      document.getElementById("profileSubjects").innerHTML = '<span class="no-data">No subjects assigned</span>';
    }

    if (schedules.length) {
      document.getElementById("profileSchedule").innerHTML = schedules.map(s => 
        `<div class="schedule-item">${s.day} ${s.startTime}-${s.endTime} - ${s.courseCode} (${s.room})</div>`
      ).join('');
    } else {
      document.getElementById("profileSchedule").innerHTML = '<span class="no-data">No schedule assigned</span>';
    }

    document.getElementById("editFromProfile").onclick = () => {
      profileModal.style.display = 'none';
      openModal('edit', id);
    };

    profileModal.style.display = 'flex';
  };

  window.editTeacher = function(id) {
    openModal("edit", id);
  };

  window.deleteTeacher = function(id) {
    deleteId = id;
    const teacher = Database.getTeachers().find(t => t.id === id);
    deleteTeacherName.textContent = teacher ? teacher.name : "";
    deleteModal.style.display = "flex";
  };

  window.goToPage = function(page) {
    currentPage = page;
    applyFilters();
  };

  confirmDelete.addEventListener("click", () => {
    if (deleteId) {
      const teacher = Database.getTeachers().find(t => t.id === deleteId);
      Database.deleteTeacher(deleteId);
      Database.addAuditLog('delete', 'teacher', deleteId, currentUser?.id, currentUser?.name, { teacherName: teacher?.name });
      showMessage('Teacher deleted successfully!', 'success');
      applyFilters();
    }
    deleteModal.style.display = "none";
    deleteId = null;
  });

  cancelDelete.addEventListener("click", () => {
    deleteModal.style.display = "none";
    deleteId = null;
  });

  addTeacherBtn.addEventListener("click", () => openModal("add"));
  closeBtn.addEventListener("click", closeModal);
  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  document.getElementById("closeProfile").addEventListener("click", () => {
    profileModal.style.display = 'none';
  });

  // Event listeners
  searchInput.addEventListener("input", applyFilters);
  filterDepartment.addEventListener("change", applyFilters);
  filterStatus.addEventListener("change", applyFilters);
  filterEmployment.addEventListener("change", applyFilters);
  filterAcademicYear.addEventListener("change", applyFilters);
  sortBy.addEventListener("change", applyFilters);
  itemsPerPage.addEventListener("change", () => {
    currentPage = 1;
    applyFilters();
  });
  clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = '';
    filterDepartment.value = '';
    filterStatus.value = '';
    filterEmployment.value = '';
    filterAcademicYear.value = '';
    sortBy.value = 'name';
    applyFilters();
  });

  // Export functions
  exportExcelBtn.addEventListener("click", () => {
    const teachers = filteredTeachers.length ? filteredTeachers : Database.getTeachers();
    let csv = 'Name,Rank,Department,Email,Contact,Units,Status,Employment Status,Specialization\n';
    teachers.forEach(t => {
      csv += `"${t.name}","${t.rank || ''}","${t.department || ''}","${t.email}","${t.contactNumber || ''}",${t.units || 0},"${t.status || 'Active'}","${t.employmentStatus || ''}","${t.specialization || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showMessage('Teachers exported to Excel successfully!', 'success');
  });

  exportCSVBtn.addEventListener("click", () => {
    exportExcelBtn.click();
  });

  exportPDFBtn.addEventListener("click", () => {
    window.print();
    showMessage('Teachers exported to PDF successfully!', 'success');
  });

  printBtn.addEventListener("click", () => {
    window.print();
  });

  // Logout
  logoutLink.addEventListener("click", e => {
    e.preventDefault();
    logoutModal.style.display = "flex";
  });

  confirmLogout.addEventListener("click", () => {
    Auth.logout();
    showMessage('You have been logged out successfully!', 'success');
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  });

  cancelLogout.addEventListener("click", () => {
    logoutModal.style.display = "none";
  });

  window.onclick = e => {
    if (e.target === modal) closeModal();
    if (e.target === deleteModal) deleteModal.style.display = "none";
    if (e.target === logoutModal) logoutModal.style.display = "none";
    if (e.target === profileModal) profileModal.style.display = "none";
  };

  // Initialize
  applyFilters();
})();

