import { useState, useEffect, useCallback } from 'react';
import { Transaction, Subscription, MoniData } from '../types';

const STORAGE_KEY = 'moni_data_v1';

const DEFAULT_DATA: MoniData = {
  transactions: [],
  subscriptions: [],
};

export const useMoniData = () => {
  const [data, setData] = useState<MoniData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save to LocalStorage whenever data changes
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, loaded]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
    };
    setData(prev => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions]
    }));
  };

  const editTransaction = (id: string, updated: Partial<Omit<Transaction, 'id'>>) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => 
        t.id === id ? { ...t, ...updated } : t
      )
    }));
  };

  const deleteTransaction = (id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const addSubscription = (s: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = {
      ...s,
      id: crypto.randomUUID(),
    };
    setData(prev => ({
      ...prev,
      subscriptions: [...prev.subscriptions, newSub]
    }));
  };

  const editSubscription = (id: string, updated: Partial<Omit<Subscription, 'id'>>) => {
    setData(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.map(s => 
        s.id === id ? { ...s, ...updated } : s
      )
    }));
  };

  const toggleSubscription = (id: string) => {
    setData(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.map(s => 
        s.id === id ? { ...s, active: !s.active } : s
      )
    }));
  };

  const deleteSubscription = (id: string) => {
    setData(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.filter(s => s.id !== id)
    }));
  };

  const importData = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      // Basic validation
      if (Array.isArray(parsed.transactions) && Array.isArray(parsed.subscriptions)) {
        setData(parsed);
        return { success: true, message: "Datos importados correctamente." };
      } else {
        return { success: false, message: "Formato de archivo inválido." };
      }
    } catch (e) {
      return { success: false, message: "Error al leer el archivo JSON." };
    }
  }, []);

  const exportData = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `moni_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [data]);

  const clearAllData = () => {
    if(window.confirm("¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.")) {
        setData(DEFAULT_DATA);
    }
  }

  return {
    data,
    addTransaction,
    editTransaction,
    deleteTransaction,
    addSubscription,
    editSubscription,
    toggleSubscription,
    deleteSubscription,
    importData,
    exportData,
    clearAllData
  };
};