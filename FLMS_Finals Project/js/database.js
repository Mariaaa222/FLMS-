const Database = (() => {
  const STORAGE_KEY = 'flms_database_v1';

  const defaultData = {
    users: [
      {
        id: 'u-1',
        name: 'System Administrator',
        email: 'admin@flms.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        id: 'u-2',
        name: 'Ms. Jamaica C. Burgos',
        email: 'burgos@ctu.edu.ph',
        password: 'teacher123',
        role: 'teacher',
        teacherId: 't-1'
      }
    ],
    teachers: [
      { 
        id: 't-1', 
        name: 'Ms. Jamaica C. Burgos', 
        email: 'burgos@ctu.edu.ph', 
        units: 12,
        rank: 'Instructor III',
        department: 'Information Technology',
        specialization: 'Programming, Database Systems',
        employmentStatus: 'Full-time',
        contactNumber: '+63 912 345 6789',
        officeHours: 'Mon-Fri 8:00 AM - 5:00 PM',
        status: 'Active',
        academicYear: '2025-2026',
        semester: '1st Semester',
        assignedSubjects: ['PC 316', 'IT 214'],
        createdAt: new Date().toISOString()
      },
      { 
        id: 't-2', 
        name: 'Ms. Krystel Jane L. Ajias', 
        email: 'ajias@ctu.edu.ph', 
        units: 12,
        rank: 'Instructor II',
        department: 'Hospitality Management',
        specialization: 'Food Service, Tourism',
        employmentStatus: 'Full-time',
        contactNumber: '+63 912 345 6790',
        officeHours: 'Mon-Fri 8:00 AM - 5:00 PM',
        status: 'Active',
        academicYear: '2025-2026',
        semester: '1st Semester',
        assignedSubjects: ['HM 111', 'HM 201'],
        createdAt: new Date().toISOString()
      },
      { 
        id: 't-3', 
        name: 'Mr. Kenty John Paculba', 
        email: 'paculba@ctu.edu.ph', 
        units: 10,
        rank: 'Instructor I',
        department: 'Information Technology',
        specialization: 'Data Structures, Algorithms',
        employmentStatus: 'Full-time',
        contactNumber: '+63 912 345 6791',
        officeHours: 'Mon-Fri 8:00 AM - 5:00 PM',
        status: 'Active',
        academicYear: '2025-2026',
        semester: '1st Semester',
        assignedSubjects: ['IT 215', 'IT 221'],
        createdAt: new Date().toISOString()
      }
    ],
    subjects: [
      { id: 's-1', code: 'IT 101', title: 'Introduction to Computing', year: '1st Year', sem: '1st Semester', units: 3, instructor: 'Ms. Burgos' },
      { id: 's-2', code: 'IT 202', title: 'Data Structures', year: '2nd Year', sem: '1st Semester', units: 3, instructor: 'Mr. Paculba' },
      { id: 's-3', code: 'IT 303', title: 'Database Management', year: '3rd Year', sem: '2nd Semester', units: 3, instructor: 'Mr. Vestil' },
      { id: 's-4', code: 'IT 404', title: 'Systems Integration', year: '4th Year', sem: '2nd Semester', units: 3, instructor: 'Ms. Cruz' }
    ],
    schedules: [
      { id: 'sc-1', courseCode: 'PC 316', instructor: 'Ms. Burgos', room: 'COMLAB', day: 'Monday', startTime: '09:00', endTime: '11:00' },
      { id: 'sc-2', courseCode: 'IT 214', instructor: 'Mr. Paculba', room: 'ROOM 101', day: 'Wednesday', startTime: '13:00', endTime: '15:00' }
    ],
    reports: [
      { id: 'r-1', teacher: 'Ms. Burgos', totalUnits: 12, subjects: ['PC 316', 'IT 214'], semester: '1st Semester', course: 'BSIT', yearLevel: '1st Year' },
      { id: 'r-2', teacher: 'Mr. Paculba', totalUnits: 15, subjects: ['IT 215', 'IT 221'], semester: '1st Semester', course: 'BSIT', yearLevel: '2nd Year' },
      { id: 'r-3', teacher: 'Ms. Ajias', totalUnits: 9, subjects: ['HM 111', 'HM 201'], semester: '1st Semester', course: 'BSHM', yearLevel: '1st Year' },
      { id: 'r-4', teacher: 'Mr. Vestil', totalUnits: 10, subjects: ['PC 101', 'IT 110'], semester: '1st Semester', course: 'BSIT', yearLevel: '3rd Year' }
    ],
    auditLogs: [],
    userActivityLogs: []
  };

  let cache = null;

  const clone = data => JSON.parse(JSON.stringify(data));

  const load = () => {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      cache = raw ? JSON.parse(raw) : clone(defaultData);
      ensureSeedUsers(cache);
    } catch (error) {
      console.error('Failed to load database, resetting.', error);
      cache = clone(defaultData);
      ensureSeedUsers(cache);
    }
    return cache;
  };

  const save = () => {
    if (!cache) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  };

  const generateId = prefix => {
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${Date.now()}-${random}`;
  };

  const ensureSeedUsers = data => {
    let updated = false;
    const users = data.users || [];
    const hasEmail = email => users.some(user => user.email?.toLowerCase() === email.toLowerCase());

    if (!users.some(user => user.role === 'admin')) {
      users.push({
        id: 'u-admin',
        name: 'System Administrator',
        email: 'admin@flms.com',
        password: 'admin123',
        role: 'admin'
      });
      updated = true;
    }

    data.teachers.forEach(teacher => {
      if (!teacher.email) return;
      if (!hasEmail(teacher.email)) {
        users.push({
          id: generateId('u'),
          name: teacher.name,
          email: teacher.email,
          password: 'teacher123',
          role: 'teacher',
          teacherId: teacher.id
        });
        updated = true;
      }
    });

    if (updated) {
      data.users = users;
      save();
    }
  };

  const getAll = key => load()[key] || [];
  const setAll = (key, items) => {
    load()[key] = items;
    save();
  };

  const addItem = (key, item, prefix) => {
    const items = getAll(key);
    const newItem = { id: generateId(prefix), ...item };
    items.push(newItem);
    setAll(key, items);
    return newItem;
  };

  const updateItem = (key, id, updates) => {
    const items = getAll(key).map(item => (item.id === id ? { ...item, ...updates } : item));
    setAll(key, items);
    return items.find(item => item.id === id) || null;
  };

  const deleteItem = (key, id) => {
    const items = getAll(key).filter(item => item.id !== id);
    setAll(key, items);
  };

  const reset = () => {
    cache = clone(defaultData);
    save();
  };

  const api = {
    init: load,
    reset,
    getUsers: () => getAll('users'),
    addUser: user => addItem('users', user, 'u'),
    updateUser: (id, updates) => updateItem('users', id, updates),
    deleteUser: id => deleteItem('users', id),
    findUserByEmail: email => getAll('users').find(user => user.email.toLowerCase() === email.toLowerCase()),

    getTeachers: () => getAll('teachers'),
    addTeacher: teacher => addItem('teachers', teacher, 't'),
    updateTeacher: (id, updates) => updateItem('teachers', id, updates),
    deleteTeacher: id => deleteItem('teachers', id),

    getSubjects: () => getAll('subjects'),
    addSubject: subject => addItem('subjects', subject, 's'),
    updateSubject: (id, updates) => updateItem('subjects', id, updates),
    deleteSubject: id => deleteItem('subjects', id),

    getSchedules: () => getAll('schedules'),
    addSchedule: schedule => addItem('schedules', schedule, 'sc'),
    updateSchedule: (id, updates) => updateItem('schedules', id, updates),
    deleteSchedule: id => deleteItem('schedules', id),

    getReports: () => getAll('reports'),
    addReport: report => addItem('reports', report, 'r'),
    updateReport: (id, updates) => updateItem('reports', id, updates),
    deleteReport: id => deleteItem('reports', id),

    findTeacherByEmail: email =>
      getAll('teachers').find(teacher => teacher.email.toLowerCase() === email.toLowerCase()),

    getAuditLogs: () => getAll('auditLogs'),
    addAuditLog: (action, entity, entityId, userId, userName, details = {}) => {
      const log = {
        action,
        entity,
        entityId,
        userId,
        userName,
        details,
        timestamp: new Date().toISOString()
      };
      return addItem('auditLogs', log, 'audit');
    },

    getUserActivityLogs: () => getAll('userActivityLogs'),
    addUserActivity: (activityType, userId, userName, userEmail, userRole, details = {}) => {
      const activity = {
        activityType, // 'signup' or 'login'
        userId,
        userName,
        userEmail,
        userRole,
        details,
        timestamp: new Date().toISOString(),
        ipAddress: details.ipAddress || 'N/A',
        userAgent: details.userAgent || navigator.userAgent
      };
      return addItem('userActivityLogs', activity, 'activity');
    },
    getUserSignups: () => getAll('userActivityLogs').filter(log => log.activityType === 'signup'),
    getUserLogins: () => getAll('userActivityLogs').filter(log => log.activityType === 'login'),
    getActivityByUser: (userId) => getAll('userActivityLogs').filter(log => log.userId === userId)
  };

  window.Database = api;
  document.addEventListener('DOMContentLoaded', load, { once: true });

  return api;
})();

