import { useState, useCallback } from 'react';
import { BankrollData, BankrollStore, DailyEntry, Settlement, PlatformBalance } from '../types/bankroll';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialBankrollStore: BankrollStore = {
  bankrolls: [],
  activeBankrollId: null,
  lastUpdate: Date.now(),
  settlements: [], // Explicitly initialize as empty array
  settlementDates: undefined
};

const useBankrollStore = () => {
  const [store, setStore] = useState<BankrollStore>(() => {
    const saved = localStorage.getItem('bankrollStore');
    return saved ? JSON.parse(saved) : initialBankrollStore;
  });

  const saveToLocalStorage = useCallback((newStore: BankrollStore) => {
    localStorage.setItem('bankrollStore', JSON.stringify(newStore));
  }, []);

  const createBankroll = useCallback((name: string, initialAmount: number) => {
    const newBankroll: BankrollData = {
      id: generateId(),
      name,
      initialAmount,
      currentAmount: initialAmount,
      makeupEffective: 0,
      lastResult: 0,
      dailyEntries: [],
      createdAt: new Date().toISOString()
    };

    setStore(prev => {
      const newStore = {
        ...prev,
        bankrolls: [...prev.bankrolls, newBankroll],
        activeBankrollId: newBankroll.id,
        lastUpdate: Date.now()
      };
      saveToLocalStorage(newStore);
      return newStore;
    });
  }, [saveToLocalStorage]);

  const setActiveBankroll = useCallback((id: string) => {
    setStore(prev => {
      const newStore = {
        ...prev,
        activeBankrollId: id,
        lastUpdate: Date.now()
      };
      saveToLocalStorage(newStore);
      return newStore;
    });
  }, [saveToLocalStorage]);

  const addDailyEntry = useCallback((
    entry: DailyEntry,
    newAmount: number,
    result: number,
    newMakeup: number
  ) => {
    setStore(prev => {
      const updatedBankrolls = prev.bankrolls.map(bankroll => 
        bankroll.id === prev.activeBankrollId
          ? {
              ...bankroll,
              currentAmount: newAmount,
              lastResult: result,
              makeupEffective: newMakeup,
              dailyEntries: [...bankroll.dailyEntries, entry]
            }
          : bankroll
      );

      const newStore = {
        ...prev,
        bankrolls: updatedBankrolls,
        lastUpdate: Date.now()
      };
      saveToLocalStorage(newStore);
      return newStore;
    });
  }, [saveToLocalStorage]);

  const updateDailyEntry = useCallback((
    entryId: string,
    platforms: PlatformBalance[],
    bankrollId: string
  ) => {
    setStore(prev => {
      const bankroll = prev.bankrolls.find(b => b.id === bankrollId);
      if (!bankroll) return prev;

      // Find the entry to update
      const entryIndex = bankroll.dailyEntries.findIndex(e => e.date === entryId);
      if (entryIndex === -1) return prev;

      // Calculate new totals based on platform data
      const result = platforms.reduce((sum, p) => {
        if (p.transactionType === 'balance') {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      const deposit = platforms.reduce((sum, p) => {
        if (p.transactionType === 'deposit') {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      const withdrawal = platforms.reduce((sum, p) => {
        if (p.transactionType === 'withdrawal') {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      // Create updated entry
      const updatedEntry: DailyEntry = {
        ...bankroll.dailyEntries[entryIndex],
        platforms,
        result,
        deposit,
        withdrawal,
        total: result + deposit - withdrawal,
      };

      // Update the entries array
      const updatedEntries = [...bankroll.dailyEntries];
      updatedEntries[entryIndex] = updatedEntry;

      // Calculate new bankroll totals
      const lastEntry = updatedEntries[updatedEntries.length - 1];
      const updatedBankroll = {
        ...bankroll,
        currentAmount: lastEntry.total,
        lastResult: lastEntry.result,
        makeupEffective: lastEntry.makeupEffective,
        dailyEntries: updatedEntries
      };

      // Update the bankrolls array
      const updatedBankrolls = prev.bankrolls.map(b =>
        b.id === bankrollId ? updatedBankroll : b
      );

      const newStore = {
        ...prev,
        bankrolls: updatedBankrolls,
        lastUpdate: Date.now()
      };
      saveToLocalStorage(newStore);
      return newStore;
    });
  }, [saveToLocalStorage]);

  const removeDailyEntry = useCallback((entryDate: string) => {
    setStore(prev => {
      const activeBankroll = prev.bankrolls.find(b => b.id === prev.activeBankrollId);
      if (!activeBankroll) return prev;

      const remainingEntries = activeBankroll.dailyEntries.filter(e => e.date !== entryDate);
      const lastEntry = remainingEntries[remainingEntries.length - 1];

      const updatedBankroll = {
        ...activeBankroll,
        currentAmount: lastEntry ? lastEntry.total : activeBankroll.initialAmount,
        makeupEffective: lastEntry ? lastEntry.makeupEffective : 0,
        lastResult: lastEntry ? lastEntry.result : 0,
        dailyEntries: remainingEntries
      };

      const updatedBankrolls = prev.bankrolls.map(bankroll =>
        bankroll.id === prev.activeBankrollId ? updatedBankroll : bankroll
      );

      const newStore = {
        ...prev,
        bankrolls: updatedBankrolls,
        lastUpdate: Date.now()
      };
      saveToLocalStorage(newStore);
      return newStore;
    });
  }, [saveToLocalStorage]);

  const addSettlement = useCallback((settlement: Settlement) => {
    setStore(prev => {
      const newStore = {
        ...prev,
        settlements: Array.isArray(prev.settlements) ? [...prev.settlements, settlement] : [settlement],
        lastUpdate: Date.now()
      };
      saveToLocalStorage(newStore);
      return newStore;
    });
  }, [saveToLocalStorage]);

  const removeSettlement = useCallback((settlementId: string) => {
    setStore(prev => {
      const newStore = {
        ...prev,
        settlements: Array.isArray(prev.settlements) ? prev.settlements.filter(s => s.id !== settlementId) : [],
        lastUpdate: Date.now()
      };
      saveToLocalStorage(newStore);
      return newStore;
    });
  }, [saveToLocalStorage]);

  const setSettlementDates = useCallback((start: string, end: string) => {
    setStore(prev => {
      const newStore = {
        ...prev,
        settlementDates: { start, end },
        lastUpdate: Date.now()
      };
      saveToLocalStorage(newStore);
      return newStore;
    });
  }, [saveToLocalStorage]);

  return {
    bankrolls: store.bankrolls,
    settlements: store.settlements || [],
    activeBankroll: store.bankrolls.find(b => b.id === store.activeBankrollId),
    lastUpdate: store.lastUpdate,
    settlementDates: store.settlementDates,
    createBankroll,
    setActiveBankroll,
    addDailyEntry,
    removeDailyEntry,
    updateDailyEntry, // Added updateDailyEntry to the returned object
    addSettlement,
    removeSettlement,
    setSettlementDates
  };
};

export default useBankrollStore;