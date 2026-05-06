import React, { createContext, useContext, useState, useEffect } from 'react';

const SimpleModeContext = createContext(null);

export function SimpleModeProvider({ children }) {
  const [simpleMode, setSimpleMode] = useState(() => {
    try {
      return localStorage.getItem('safebeat_simple_mode') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('safebeat_simple_mode', simpleMode);
  }, [simpleMode]);

  return (
    <SimpleModeContext.Provider value={{ simpleMode, setSimpleMode }}>
      {children}
    </SimpleModeContext.Provider>
  );
}

export const useSimpleMode = () => {
  const ctx = useContext(SimpleModeContext);
  if (!ctx) throw new Error('useSimpleMode must be used within SimpleModeProvider');
  return ctx;
};
