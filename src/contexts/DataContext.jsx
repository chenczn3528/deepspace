import React, { createContext, useContext } from 'react';
import { useDataLoader } from '../hooks/useDataLoader.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const data = useDataLoader();

  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
