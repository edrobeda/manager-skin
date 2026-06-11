import { createContext, useContext, useMemo } from 'react';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const session = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('session') || '{}'); }
    catch { return {}; }
  }, []);

  const user   = session.user   || {};
  const tenant = session.tenant || null;
  const role   = user.role      || null;

  const isSuper = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuper;

  // can('backup:delete') etc.
  const can = (action) => {
    const rules = {
      'tenant:manage':  isSuper,
      'backup:restore': isSuper,
      'backup:delete':  isSuper,
      'backup:create':  isAdmin,
      'quiz:edit':      isAdmin,
      'premios:edit':   isAdmin,
      'webs:edit':      isAdmin,
    };
    return rules[action] ?? isAdmin;
  };

  return (
    <TenantContext.Provider value={{ user, tenant, role, isSuper, isAdmin, can }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant deve ser usado dentro de TenantProvider');
  return ctx;
};
