import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { SettlementPeriod, SettlementEntry, SettlementSummary } from '../types/settlement';
import toast from 'react-hot-toast';

export const useSettlements = () => {
  const [settlements, setSettlements] = useState<SettlementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState<SettlementPeriod | null>(null);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      
      // Fetch all settlement periods
      const { data: periodsData, error: periodsError } = await supabase
        .from('settlement_periods')
        .select('*')
        .order('start_date', { ascending: false });

      if (periodsError) throw periodsError;

      // Fetch entries for all periods
      const { data: entriesData, error: entriesError } = await supabase
        .from('settlement_entries')
        .select('*')
        .in('settlement_id', periodsData.map(p => p.id));

      if (entriesError) throw entriesError;

      // Group entries by settlement period
      const summaries: SettlementSummary[] = periodsData.map(period => {
        const periodEntries = entriesData.filter(e => e.settlement_id === period.id);
        return {
          period: {
            id: period.id,
            startDate: new Date(period.start_date),
            endDate: new Date(period.end_date),
            status: period.status,
            closedAt: period.closed_at ? new Date(period.closed_at) : undefined,
            closedBy: period.closed_by,
            createdAt: new Date(period.created_at),
            createdBy: period.created_by,
            totalProfit: period.total_profit,
            totalMakeup: period.total_makeup
          },
          entries: periodEntries.map(entry => ({
            id: entry.id,
            settlementId: entry.settlement_id,
            playerId: entry.player_id,
            initialMakeup: entry.initial_makeup,
            finalMakeup: entry.final_makeup,
            totalDeposits: entry.total_deposits,
            totalWithdrawals: entry.total_withdrawals,
            profitShare: entry.profit_share,
            totalProfit: entry.total_profit,
            createdAt: new Date(entry.created_at),
            locked: entry.locked
          })),
          totalPlayers: periodEntries.length,
          totalProfit: period.total_profit,
          totalMakeup: period.total_makeup
        };
      });

      setSettlements(summaries);

      // Find current open period
      const openPeriod = periodsData.find(p => p.status === 'open');
      if (openPeriod) {
        setCurrentPeriod({
          id: openPeriod.id,
          startDate: new Date(openPeriod.start_date),
          endDate: new Date(openPeriod.end_date),
          status: openPeriod.status,
          createdAt: new Date(openPeriod.created_at),
          createdBy: openPeriod.created_by,
          totalProfit: openPeriod.total_profit,
          totalMakeup: openPeriod.total_makeup
        });
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const createSettlementPeriod = async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('settlement_periods')
        .insert({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Settlement period created');
      await fetchSettlements();
      return data;
    } catch (error) {
      console.error('Error creating settlement period:', error);
      toast.error('Failed to create settlement period');
      return null;
    }
  };

  const closeSettlementPeriod = async (settlementId: string) => {
    try {
      const { error } = await supabase
        .from('settlement_periods')
        .update({ status: 'closed' })
        .eq('id', settlementId);

      if (error) throw error;

      toast.success('Settlement period closed');
      await fetchSettlements();
      return true;
    } catch (error) {
      console.error('Error closing settlement period:', error);
      toast.error('Failed to close settlement period');
      return false;
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  return {
    settlements,
    currentPeriod,
    loading,
    createSettlementPeriod,
    closeSettlementPeriod,
    refreshSettlements: fetchSettlements
  };
};