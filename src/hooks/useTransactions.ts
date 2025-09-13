import { useState, useEffect } from 'react';
import { TransactionService } from '../services/transactions';
import { Transaction } from '../App';

export function useTransactions(userId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const userTransactions = await TransactionService.getUserTransactions(userId);
      setTransactions(userTransactions);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Не удалось загрузить транзакции');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && userId !== 'demo-user' && !userId.includes('Demo')) {
      loadTransactions();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const refreshTransactions = () => {
    if (userId && userId !== 'demo-user' && !userId.includes('Demo')) {
      loadTransactions();
    }
  };

  return {
    transactions,
    loading,
    error,
    refreshTransactions
  };
}

export function useTransactionStats(userId: string) {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSpent: 0,
    totalTokens: 0,
    avgTransactionSize: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        if (userId && userId !== 'demo-user' && !userId.includes('Demo')) {
          const transactionStats = await TransactionService.getUserTransactionStats(userId);
          setStats(transactionStats);
        }
      } catch (error) {
        console.error('Error loading transaction stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  return { stats, loading };
}