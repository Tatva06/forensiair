import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext(null);

const STORAGE_KEY = 'forensier_view_mode';

export function ViewModeProvider({ children, currentUser }) {
  const [mode, setModeState] = useState(() => {
    // 1. Check localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'simple' || saved === 'technical') {
        return saved;
      }
    } catch {
      // LocalStorage access might fail in private windows
    }

    // 2. Default according to user role:
    // Government officers, inspectors default to 'simple'.
    // Admins, engineers default to 'technical' unless changed.
    const role = currentUser?.role || 'inspector';
    return role === 'admin' ? 'technical' : 'simple';
  });

  // When currentUser changes, if no manual preference stored, align default
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved && currentUser) {
        const role = currentUser.role || 'inspector';
        setModeState(role === 'admin' ? 'technical' : 'simple');
      }
    } catch {
      // Ignore
    }
  }, [currentUser]);

  const setMode = (newMode) => {
    if (newMode !== 'simple' && newMode !== 'technical') return;
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore
    }
  };

  const toggleMode = () => {
    setMode(mode === 'simple' ? 'technical' : 'simple');
  };

  return (
    <ViewModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isSimple: mode === 'simple',
        isTechnical: mode === 'technical'
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    // Fallback safe values if used outside provider
    return {
      mode: 'simple',
      setMode: () => {},
      toggleMode: () => {},
      isSimple: true,
      isTechnical: false
    };
  }
  return context;
}
