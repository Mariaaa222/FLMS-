const Auth = (() => {
  const SESSION_KEY = 'flms_session';

  const getSession = () => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const persistSession = (session, remember = false) => {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(session));
    (remember ? sessionStorage : localStorage).removeItem(SESSION_KEY);
  };

  const login = (user, options = { remember: false }) => {
    if (!user) throw new Error('Cannot login without user data');
    const session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'admin',
      loggedInAt: Date.now()
    };
    persistSession(session, options.remember);
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  };

  const getCurrentUser = () => {
    const session = getSession();
    if (!session) return null;
    const user = Database.getUsers().find(u => u.id === session.userId);
    if (user) return user;
    logout();
    return null;
  };

  const isAuthenticated = () => !!getSession();

  const requireAuth = () => {
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
    }
  };

  return {
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
    requireAuth
  };
})();

