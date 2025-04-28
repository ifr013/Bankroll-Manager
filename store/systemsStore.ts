import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

export type System = {
  id: string;
  name: string;
  type: string;
  stakingPercentage: number;
  createdAt: Date;
  adminId: string;
  totalBalance: number;
  playersCount: number;
  status: 'active' | 'paused' | 'closed';
};

export type Player = {
  id: string;
  name: string;
  email: string;
  systemId: string;
  balance: number;
  makeup: number;
  profit: number;
  bankReserve: number;
  avatar?: string;
};

export type Transaction = {
  id: string;
  playerId: string;
  systemId: string;
  date: Date;
  balance: number;
  reload: number;
  withdrawal: number;
  result: number;
  previousMakeup: number;
  currentMakeup: number;
  profit: number;
  playerWithdrawal: number;
  bankReserve: number;
  totalBalance: number;
  status?: 'pending' | 'approved' | 'rejected';
  settlementId?: string;
  isLocked?: boolean;
};

export type Settlement = {
  id: string;
  systemId: string;
  startDate: Date;
  endDate: Date;
  totalProfit: number;
  totalMakeup: number;
  totalBalance: number;
  players: {
    playerId: string;
    profit: number;
    makeup: number;
    balance: number;
  }[];
  status: 'pending' | 'completed';
  createdAt: Date;
};

export type RecentActivity = {
  id: string;
  type: 'deposit' | 'player_added' | 'settlement' | 'withdrawal';
  playerId?: string;
  playerName?: string;
  amount?: number;
  systemId?: string;
  period?: string;
  date: Date;
};

export type Platform = 'PokerStars' | 'GGPoker' | 'ACR';
export type PlatformBalance = {
  platform: Platform;
  balance: number;
};

interface SystemsState {
  systems: System[];
  players: Player[];
  transactions: Transaction[];
  settlements: Settlement[];
  recentActivities: RecentActivity[];
  platformBalances: PlatformBalance[];
  
  createSystem: (system: Omit<System, 'id' | 'createdAt' | 'playersCount' | 'totalBalance' | 'status'>) => string;
  addPlayerToSystem: (player: Omit<Player, 'id' | 'balance' | 'makeup' | 'profit' | 'bankReserve'>) => string;
  getSystemsByAdminId: (adminId: string) => System[];
  getSystemById: (systemId: string) => System | undefined;
  getPlayersBySystemId: (systemId: string) => Player[];
  
  createSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt' | 'status'>) => string;
  getSettlementsBySystemId: (systemId: string) => Settlement[];
  getSettlementById: (settlementId: string) => Settlement | undefined;
  finalizeSettlement: (settlementId: string) => void;
  isTransactionLocked: (date: Date) => boolean;
  getActiveSettlementPeriod: (systemId: string) => { startDate: Date; endDate: Date } | null;
  
  getSystemsByPlayerId: (playerId: string) => System[];
  getPlayerById: (playerId: string) => Player | undefined;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status'>) => string;
  deleteTransaction: (transactionId: string) => void;
  getTransactionsByPlayerId: (playerId: string) => Transaction[];
  getTransactionsBySystemId: (systemId: string) => Transaction[];
  getPlatformBalancesByPlayerId: (playerId: string) => PlatformBalance[];
  getRecentActivities: () => RecentActivity[];
  unlockSettlementPeriod: (systemId: string, startDate: Date, endDate: Date) => void;
}

const ensureDate = (date: Date | string): Date => {
  return typeof date === 'string' ? new Date(date) : date;
};

const generateId = () => Math.random().toString(36).substring(2, 12);

const useSystemsStore = create(
  persist<SystemsState>(
    (set, get) => ({
      systems: [
        {
          id: 'sys1',
          name: 'Poker Bankroll Manager',
          type: 'STAKING 50/50',
          stakingPercentage: 50,
          createdAt: new Date('2024-01-15'),
          adminId: '1',
          totalBalance: 245000,
          playersCount: 24,
          status: 'active',
        }
      ],
      
      players: [
        {
          id: 'player1',
          name: 'John Doe',
          email: 'john@example.com',
          systemId: 'sys1',
          balance: 24500,
          makeup: 15000,
          profit: 3500,
          bankReserve: 0,
        },
        {
          id: 'player2',
          name: 'New Player',
          email: 'player@example.com',
          systemId: 'sys1',
          balance: 100,
          makeup: 0,
          profit: -22040,
          bankReserve: 0,
        }
      ],
      
      transactions: [],
      settlements: [],
      
      platformBalances: [
        { platform: 'PokerStars', balance: 12500 },
        { platform: 'GGPoker', balance: 8000 },
        { platform: 'ACR', balance: 4000 }
      ],
      
      recentActivities: [
        {
          id: 'act1',
          type: 'deposit',
          playerId: 'player1',
          playerName: 'John Doe',
          amount: 5000,
          date: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 'act2',
          type: 'player_added',
          playerId: 'player3',
          playerName: 'Sarah Smith',
          date: new Date(Date.now() - 5 * 60 * 60 * 1000)
        }
      ],
      
      createSystem: (systemData) => {
        const id = generateId();
        const newSystem: System = {
          ...systemData,
          id,
          createdAt: new Date(),
          playersCount: 0,
          totalBalance: 0,
          status: 'active'
        };
        
        set((state) => ({
          systems: [...state.systems, newSystem]
        }));
        
        return id;
      },
      
      addPlayerToSystem: (playerData) => {
        const id = generateId();
        const newPlayer: Player = {
          ...playerData,
          id,
          balance: 0,
          makeup: 0,
          profit: 0,
          bankReserve: 0
        };
        
        set((state) => ({
          players: [...state.players, newPlayer],
          systems: state.systems.map(system => 
            system.id === playerData.systemId 
              ? { ...system, playersCount: system.playersCount + 1 }
              : system
          ),
          recentActivities: [
            {
              id: generateId(),
              type: 'player_added',
              playerId: id,
              playerName: playerData.name,
              date: new Date()
            },
            ...state.recentActivities
          ]
        }));
        
        return id;
      },
      
      getSystemsByAdminId: (adminId) => {
        return get().systems.filter(system => system.adminId === adminId);
      },
      
      getSystemById: (systemId) => {
        return get().systems.find(system => system.id === systemId);
      },
      
      getPlayersBySystemId: (systemId) => {
        return get().players.filter(player => player.systemId === systemId);
      },
      
      createSettlement: (settlementData) => {
        const id = generateId();
        const newSettlement: Settlement = {
          ...settlementData,
          id,
          status: 'pending',
          createdAt: new Date()
        };
        
        set((state) => ({
          settlements: [...state.settlements, newSettlement],
          recentActivities: [
            {
              id: generateId(),
              type: 'settlement',
              systemId: settlementData.systemId,
              period: `${format(settlementData.startDate, 'MMM d')} - ${format(settlementData.endDate, 'MMM d')}`,
              date: new Date()
            },
            ...state.recentActivities
          ]
        }));
        
        return id;
      },
      
      getSettlementsBySystemId: (systemId) => {
        return get().settlements
          .filter(settlement => settlement.systemId === systemId)
          .sort((a, b) => ensureDate(b.createdAt).getTime() - ensureDate(a.createdAt).getTime());
      },
      
      getSettlementById: (settlementId) => {
        return get().settlements.find(settlement => settlement.id === settlementId);
      },
      
      isTransactionLocked: (date: Date) => {
        const state = get();
        return state.settlements.some(settlement => 
          settlement.status === 'completed' &&
          ensureDate(date) >= ensureDate(settlement.startDate) &&
          ensureDate(date) <= ensureDate(settlement.endDate)
        );
      },
      
      getActiveSettlementPeriod: (systemId: string) => {
        const state = get();
        const activePeriod = state.settlements.find(settlement => 
          settlement.systemId === systemId &&
          settlement.status === 'pending'
        );
        
        return activePeriod ? {
          startDate: ensureDate(activePeriod.startDate),
          endDate: ensureDate(activePeriod.endDate)
        } : null;
      },
      
      finalizeSettlement: (settlementId) => {
        set((state) => {
          const settlement = state.settlements.find(s => s.id === settlementId);
          if (!settlement) return state;
          
          const settlementTransactions = state.transactions.filter(tx => 
            ensureDate(tx.date) >= ensureDate(settlement.startDate) && 
            ensureDate(tx.date) <= ensureDate(settlement.endDate) && 
            tx.systemId === settlement.systemId
          );
          
          const playerTransactions = new Map();
          settlementTransactions.forEach(tx => {
            if (!playerTransactions.has(tx.playerId)) {
              playerTransactions.set(tx.playerId, []);
            }
            playerTransactions.get(tx.playerId).push(tx);
          });
          
          const playerSettlements = new Map();
          playerTransactions.forEach((transactions, playerId) => {
            const totalProfit = transactions.reduce((sum, tx) => sum + tx.profit, 0);
            const currentMakeup = transactions[transactions.length - 1].currentMakeup;
            const lastTransaction = transactions[transactions.length - 1];
            
            playerSettlements.set(playerId, {
              profit: totalProfit,
              playerWithdrawal: lastTransaction.playerWithdrawal + (totalProfit > 0 ? totalProfit : 0),
              makeup: currentMakeup,
              bankReserve: lastTransaction.bankReserve
            });
          });
          
          const updatedTransactions = state.transactions.map(tx => {
            if (ensureDate(tx.date) >= ensureDate(settlement.startDate) && 
                ensureDate(tx.date) <= ensureDate(settlement.endDate) && 
                tx.systemId === settlement.systemId) {
              const playerSettlement = playerSettlements.get(tx.playerId);
              const isLastTransaction = tx === playerTransactions.get(tx.playerId)[playerTransactions.get(tx.playerId).length - 1];
              
              if (isLastTransaction) {
                return {
                  ...tx,
                  settlementId,
                  isLocked: true,
                  playerWithdrawal: playerSettlement.playerWithdrawal
                };
              }
              
              return { 
                ...tx, 
                settlementId,
                isLocked: true
              };
            }
            return tx;
          });
          
          const updatedPlayers = state.players.map(player => {
            const settlement = playerSettlements.get(player.id);
            if (settlement) {
              return {
                ...player,
                profit: settlement.profit > 0 ? 0 : player.profit,
                makeup: settlement.makeup,
                bankReserve: settlement.bankReserve
              };
            }
            return player;
          });
          
          const updatedSettlements = state.settlements.map(s => 
            s.id === settlementId ? { ...s, status: 'completed' } : s
          );
          
          const newActivity = {
            id: generateId(),
            type: 'settlement' as const,
            systemId: settlement.systemId,
            period: `${format(settlement.startDate, 'MMM d')} - ${format(settlement.endDate, 'MMM d')}`,
            date: new Date()
          };
          
          return {
            transactions: updatedTransactions,
            players: updatedPlayers,
            settlements: updatedSettlements,
            recentActivities: [newActivity, ...state.recentActivities]
          };
        });
      },
      
      getSystemsByPlayerId: (playerId) => {
        const player = get().players.find(p => p.id === playerId);
        if (!player) return [];
        
        return get().systems.filter(system => system.id === player.systemId);
      },
      
      getPlayerById: (playerId) => {
        return get().players.find(player => player.id === playerId);
      },
      
      addTransaction: (transactionData) => {
        const id = generateId();
        
        const previousTransactions = get().transactions
          .filter(tx => tx.playerId === transactionData.playerId)
          .sort((a, b) => ensureDate(b.date).getTime() - ensureDate(a.date).getTime());
        
        const previousWithdrawal = previousTransactions[0]?.playerWithdrawal || 0;
        
        const newTransaction: Transaction = {
          ...transactionData,
          id,
          status: 'pending',
          playerWithdrawal: previousWithdrawal
        };
        
        set((state) => {
          const updatedPlayers = state.players.map(player => {
            if (player.id === transactionData.playerId) {
              return {
                ...player,
                balance: transactionData.balance,
                makeup: transactionData.currentMakeup,
                profit: player.profit + transactionData.profit,
                bankReserve: transactionData.bankReserve
              };
            }
            return player;
          });
          
          const updatedSystems = state.systems.map(system => {
            if (system.id === transactionData.systemId) {
              return {
                ...system,
                totalBalance: system.totalBalance + transactionData.result
              };
            }
            return system;
          });
          
          let newActivities = [...state.recentActivities];
          const player = state.players.find(p => p.id === transactionData.playerId);
          
          if (transactionData.reload > 0) {
            newActivities.unshift({
              id: generateId(),
              type: 'deposit',
              playerId: transactionData.playerId,
              playerName: player?.name,
              amount: transactionData.reload,
              date: transactionData.date
            });
          }
          
          if (transactionData.withdrawal > 0) {
            newActivities.unshift({
              id: generateId(),
              type: 'withdrawal',
              playerId: transactionData.playerId,
              playerName: player?.name,
              amount: transactionData.withdrawal,
              date: transactionData.date
            });
          }
          
          return {
            transactions: [newTransaction, ...state.transactions],
            players: updatedPlayers,
            systems: updatedSystems,
            recentActivities: newActivities
          };
        });
        
        return id;
      },
      
      deleteTransaction: (transactionId) => {
        set((state) => {
          const transaction = state.transactions.find(tx => tx.id === transactionId);
          if (!transaction) return state;
          
          if (transaction.isLocked) {
            throw new Error('Cannot delete a locked transaction');
          }

          const updatedPlayers = state.players.map(player => {
            if (player.id === transaction.playerId) {
              return {
                ...player,
                balance: player.balance - transaction.balance,
                makeup: player.makeup - (transaction.currentMakeup - transaction.previousMakeup),
                profit: player.profit - transaction.profit,
                bankReserve: player.bankReserve - transaction.bankReserve
              };
            }
            return player;
          });

          const updatedSystems = state.systems.map(system => {
            if (system.id === transaction.systemId) {
              return {
                ...system,
                totalBalance: system.totalBalance - transaction.result
              };
            }
            return system;
          });

          return {
            transactions: state.transactions.filter(tx => tx.id !== transactionId),
            players: updatedPlayers,
            systems: updatedSystems
          };
        });
      },
      
      getTransactionsByPlayerId: (playerId) => {
        return get().transactions
          .filter(tx => tx.playerId === playerId)
          .sort((a, b) => ensureDate(b.date).getTime() - ensureDate(a.date).getTime());
      },
      
      getTransactionsBySystemId: (systemId) => {
        return get().transactions
          .filter(tx => tx.systemId === systemId)
          .sort((a, b) => ensureDate(b.date).getTime() - ensureDate(a.date).getTime());
      },
      
      getPlatformBalancesByPlayerId: (playerId) => {
        return get().platformBalances;
      },
      
      getRecentActivities: () => {
        return get().recentActivities.sort((a, b) => ensureDate(b.date).getTime() - ensureDate(a.date).getTime());
      },

      unlockSettlementPeriod: (systemId, startDate, endDate) => {
        set((state) => {
          const updatedTransactions = state.transactions.map(tx => {
            if (tx.systemId === systemId &&
                ensureDate(tx.date) >= ensureDate(startDate) &&
                ensureDate(tx.date) <= ensureDate(endDate)) {
              return {
                ...tx,
                isLocked: false,
                settlementId: undefined
              };
            }
            return tx;
          });
          
          const updatedSettlements = state.settlements.map(s => {
            if (s.systemId === systemId &&
                ensureDate(s.startDate) >= ensureDate(startDate) &&
                ensureDate(s.endDate) <= ensureDate(endDate)) {
              return {
                ...s,
                status: 'pending'
              };
            }
            return s;
          });
          
          return {
            transactions: updatedTransactions,
            settlements: updatedSettlements
          };
        });
      }
    }),
    {
      name: 'poker-bankroll-store',
      version: 1,
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          if (data.state) {
            if (data.state.transactions) {
              data.state.transactions = data.state.transactions.map((tx: any) => ({
                ...tx,
                date: new Date(tx.date)
              }));
            }
            if (data.state.settlements) {
              data.state.settlements = data.state.settlements.map((s: any) => ({
                ...s,
                startDate: new Date(s.startDate),
                endDate: new Date(s.endDate),
                createdAt: new Date(s.createdAt)
              }));
            }
            if (data.state.recentActivities) {
              data.state.recentActivities = data.state.recentActivities.map((a: any) => ({
                ...a,
                date: new Date(a.date)
              }));
            }
          }
          return data;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);

export default useSystemsStore;