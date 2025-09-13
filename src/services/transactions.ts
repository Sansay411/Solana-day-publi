import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Transaction } from '../App';

export class TransactionService {
  private static readonly COLLECTION_NAME = 'transactions';

  // Создать новую транзакцию
  static async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...transaction,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      console.log('Transaction created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Не удалось создать транзакцию');
    }
  }

  // Обновить статус транзакции
  static async updateTransactionStatus(
    transactionId: string, 
    status: Transaction['status'],
    transactionHash?: string
  ): Promise<void> {
    try {
      const transactionRef = doc(db, this.COLLECTION_NAME, transactionId);
      const updateData: any = { 
        status,
        updatedAt: Timestamp.now()
      };
      
      if (transactionHash) {
        updateData.transactionHash = transactionHash;
      }
      
      await updateDoc(transactionRef, updateData);
      console.log('Transaction status updated:', transactionId, status);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw new Error('Не удалось обновить статус транзакции');
    }
  }

  // Получить транзакции пользователя
  static async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
        } as Transaction);
      });
      
      return transactions;
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  }

  // Получить последние транзакции для маркетплейса
  static async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'completed'),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        if (transactions.length < limit) {
          const data = doc.data();
          transactions.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
          } as Transaction);
        }
      });
      
      return transactions;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  // Получить статистику транзакций пользователя
  static async getUserTransactionStats(userId: string): Promise<{
    totalTransactions: number;
    totalSpent: number;
    totalTokens: number;
    avgTransactionSize: number;
  }> {
    try {
      const transactions = await this.getUserTransactions(userId);
      const completedTransactions = transactions.filter(t => t.status === 'completed');
      
      const totalTransactions = completedTransactions.length;
      const totalSpent = completedTransactions.reduce((sum, t) => sum + t.totalValue, 0);
      const totalTokens = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const avgTransactionSize = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
      
      return {
        totalTransactions,
        totalSpent,
        totalTokens,
        avgTransactionSize
      };
    } catch (error) {
      console.error('Error calculating transaction stats:', error);
      return {
        totalTransactions: 0,
        totalSpent: 0,
        totalTokens: 0,
        avgTransactionSize: 0
      };
    }
  }

  // Получить транзакцию по ID
  static async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, transactionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
        } as Transaction;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }
}