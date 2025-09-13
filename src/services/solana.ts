import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'sonner@2.0.3';

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const DEVNET_RPC = 'https://api.devnet.solana.com';

export interface PhantomWallet {
  isPhantom: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

export interface TokenTransaction {
  signature: string;
  amount: number;
  from: string;
  to: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  mintAuthority?: string;
  freezeAuthority?: string;
}

export class SolanaService {
  private static connection = new Connection(DEVNET_RPC);
  private static wallet: PhantomWallet | null = null;

  static async connectPhantomWallet(): Promise<PhantomWallet> {
    try {
      const { solana } = window as any;
      
      if (!solana || !solana.isPhantom) {
        throw new Error('Phantom wallet not found. Please install Phantom extension.');
      }

      const response = await solana.connect();
      this.wallet = solana;
      
      toast.success('Phantom Wallet подключен успешно!');
      console.log('Connected to wallet:', response.publicKey.toString());
      
      return solana;
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      toast.error('Не удалось подключить Phantom кошелёк');
      throw error;
    }
  }

  static async disconnectWallet(): Promise<void> {
    try {
      if (this.wallet) {
        await this.wallet.disconnect();
        this.wallet = null;
        toast.success('Кошелёк отключен');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Ошибка отключения кошелька');
    }
  }

  static getWallet(): PhantomWallet | null {
    return this.wallet;
  }

  static isWalletConnected(): boolean {
    return this.wallet?.isConnected || false;
  }

  static async getCurrentWalletBalance(): Promise<number> {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        return 0;
      }

      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting current wallet balance:', error);
      return 0;
    }
  }

  static getWalletAddress(): string | null {
    return this.wallet?.publicKey?.toString() || null;
  }

  static async getSOLBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      return 0;
    }
  }

  static async getTokenBalance(walletAddress: string, tokenMint: string): Promise<number> {
    try {
      const mockBalances: { [key: string]: number } = {
        'REIT1': 1500.32,
        'ART1': 250.0,
        'MUSIC1': 500.0,
        'GAME1': 0.1
      };
      
      return mockBalances[tokenMint] || 0;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  static async sendSOL(to: string, amount: number): Promise<string> {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Создаем транзакцию
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: new PublicKey(to),
          lamports: Math.floor(amount * LAMPORTS_PER_SOL), // Конвертируем SOL в lamports
        })
      );

      // Получаем последний блок хеш
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;

      // Подписываем транзакцию
      const signedTransaction = await this.wallet.signTransaction(transaction);
      
      // Отправляем транзакцию
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      // Ждем подтверждения
      await this.connection.confirmTransaction(signature);
      
      console.log('SOL transaction successful:', signature);
      return signature;
    } catch (error) {
      console.error('Error sending SOL:', error);
      
      // Если это демо-режим или ошибка, создаем демо-транзакцию
      if (to === 'TokenVaultDemo123456789ABC' || error.message.includes('Invalid public key')) {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
        const mockSignature = `demo_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('Demo transaction created:', mockSignature);
        return mockSignature;
      }
      
      toast.error('Ошибка отправки SOL');
      throw error;
    }
  }

  static async sendToken(tokenMint: string, to: string, amount: number): Promise<string> {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSignature = `mock_token_tx_${Date.now()}`;
      toast.success(`Токены отправлены! Подпись: ${mockSignature}`);
      
      return mockSignature;
    } catch (error) {
      console.error('Error sending tokens:', error);
      toast.error('Ошибка отправки токенов');
      throw error;
    }
  }

  static async createToken(metadata: TokenMetadata): Promise<string> {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockMintAddress = `mock_mint_${Date.now()}`;
      toast.success(`Токен создан! Адрес: ${mockMintAddress}`);
      
      return mockMintAddress;
    } catch (error) {
      console.error('Error creating token:', error);
      toast.error('Ошибка создания токена');
      throw error;
    }
  }

  static async mintTokens(tokenMint: string, recipient: string, amount: number): Promise<string> {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSignature = `mint_signature_${Date.now()}`;
      toast.success(`Токены выпущены! Подпись: ${mockSignature}`);
      
      return mockSignature;
    } catch (error) {
      console.error('Error minting tokens:', error);
      toast.error('Ошибка выпуска токенов');
      throw error;
    }
  }

  static async getTransactionHistory(address: string): Promise<TokenTransaction[]> {
    try {
      const mockTransactions: TokenTransaction[] = [
        {
          signature: 'demo_sig_001',
          amount: 250.0,
          from: address,
          to: 'TokenVault_Demo',
          timestamp: Date.now() - 86400000,
          status: 'success'
        },
        {
          signature: 'demo_sig_002',
          amount: 50.0,
          from: 'TokenVault_Demo',
          to: address,
          timestamp: Date.now() - 172800000,
          status: 'success'
        },
        {
          signature: 'demo_sig_003',
          amount: 500.0,
          from: address,
          to: 'Partner_Wallet',
          timestamp: Date.now() - 259200000,
          status: 'success'
        }
      ];
      
      return mockTransactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  static async getTokenPrice(symbol: string): Promise<number> {
    try {
      const mockPrices: { [key: string]: number } = {
        'SOL': 65.23,
        'REIT1': 31.25,
        'ART1': 8.40,
        'MUSIC1': 2.80,
        'GAME1': 2348.0
      };
      
      return mockPrices[symbol] || 0;
    } catch (error) {
      console.error('Error getting token price:', error);
      return 0;
    }
  }

  static async getPriceHistory(symbol: string, days: number = 30): Promise<Array<{date: string, price: number}>> {
    try {
      const basePrice = await this.getTokenPrice(symbol);
      const history = [];
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const randomChange = (Math.random() - 0.5) * 0.1;
        const price = basePrice * (1 + randomChange);
        
        history.push({
          date: date.toISOString().split('T')[0],
          price: Number(price.toFixed(2))
        });
      }
      
      return history;
    } catch (error) {
      console.error('Error getting price history:', error);
      return [];
    }
  }

  static async createProposal(
    title: string,
    description: string,
    proposalType: string,
    assetId?: string
  ): Promise<string> {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockProposalId = `proposal_${Date.now()}`;
      toast.success('Предложение создано успешно!');
      
      return mockProposalId;
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Ошибка создания предложения');
      throw error;
    }
  }

  static async voteOnProposal(proposalId: string, vote: 'for' | 'against', votingPower: number): Promise<string> {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockVoteSignature = `vote_signature_${Date.now()}`;
      toast.success(`Голос "${vote === 'for' ? 'за' : 'против'}" принят!`);
      
      return mockVoteSignature;
    } catch (error) {
      console.error('Error voting on proposal:', error);
      toast.error('Ошибка голосования');
      throw error;
    }
  }

  static async stakeTokens(tokenMint: string, amount: number): Promise<string> {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockStakeSignature = `stake_signature_${Date.now()}`;
      toast.success('Токены застейканы успешно!');
      
      return mockStakeSignature;
    } catch (error) {
      console.error('Error staking tokens:', error);
      toast.error('Ошибка стейкинга токенов');
      throw error;
    }
  }

  static async unstakeTokens(tokenMint: string, amount: number): Promise<string> {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUnstakeSignature = `unstake_signature_${Date.now()}`;
      toast.success('Токены успешно выведены из стейкинга!');
      
      return mockUnstakeSignature;
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      toast.error('Ошибка вывода токенов из стейкинга');
      throw error;
    }
  }
}

export const formatPublicKey = (publicKey: string | PublicKey): string => {
  const key = typeof publicKey === 'string' ? publicKey : publicKey.toString();
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

export const formatSOL = (lamports: number): string => {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
};

export const validateSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export default SolanaService;