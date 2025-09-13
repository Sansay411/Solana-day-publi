import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, User as FirebaseUser } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  addDoc,
  orderBy,
  limit,
  writeBatch,
  increment,
  arrayUnion,
  deleteDoc,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('WebChannelConnection') || 
        message.includes('transport errored') ||
        message.includes('@firebase/firestore') ||
        message.includes('client is offline') ||
        message.includes('Failed to get document because the client is offline')) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('WebChannelConnection') || 
        message.includes('transport errored') ||
        message.includes('client is offline') ||
        message.includes('Failed to get document because the client is offline')) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

import { isDemoMode, DemoServices } from './demoService';
import { mockAuth } from './mockAuth';
import { FirebaseOfflineManager } from './firebaseOffline';
import { AppModeManager } from './appModeManager';

let app: any;
let analytics: any;
let auth: any;
let db: any;
let storage: any;

if (!isDemoMode()) {
  const firebaseConfig = {
    apiKey: "AIzaSyCGttoSIWiCp1ii1BPGqBI0x660kDk4kng",
    authDomain: "solana-95835.firebaseapp.com",
    databaseURL: "https://solana-95835-default-rtdb.firebaseio.com",
    projectId: "solana-95835",
    storageBucket: "solana-95835.firebasestorage.app",
    messagingSenderId: "517867742528",
    appId: "1:517867742528:web:aa71421f5e8321062786a5",
    measurementId: "G-11LW4VKMMN"
  };

  try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    auth = getAuth(app);
    storage = getStorage(app);

    try {
      db = initializeFirestore(app, {
        cache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        }),
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: false
      });
      console.log('Firestore initialized with persistent cache');
      setTimeout(() => {
        AppModeManager.initialize().catch((error) => {
          console.warn('AppModeManager initialization failed:', error);
        });
      }, 1000);
      
    } catch (cacheError: any) {
      console.warn('Failed to initialize Firestore with cache, falling back to default:', cacheError);
      // Fallback to default Firestore if cache initialization fails
      try {
        db = getFirestore(app);
        console.log('Firestore initialized with default settings');
        
        // Даем Firebase время на инициализацию
        setTimeout(() => {
          AppModeManager.initialize().catch((error) => {
            console.warn('AppModeManager initialization failed:', error);
          });
        }, 1000);
        
      } catch (fallbackError) {
        console.error('Failed to initialize default Firestore:', fallbackError);
        throw fallbackError;
      }
    }

    console.log('Firebase initialized successfully');
    
  } catch (error: any) {
    console.error('Error initializing Firebase:', error);
    
    // При ошибке инициализации переходим в демо режим
    auth = mockAuth;
    console.log('🔧 Switched to demo mode due to Firebase initialization failure');
    
    // Инициализируем AppModeManager в демо режиме
    AppModeManager.forceMode('demo', 'Firebase initialization failed').catch((error) => {
      console.warn('AppModeManager demo mode setup failed:', error);
    });
  }
} else {
  auth = mockAuth;
}

export interface UserProfile {
  id: string;
  email: string;
  walletAddress?: string | null;
  isKYCVerified: boolean;
  kycData?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    phone: string;
    idNumber: string;
    idType: string;
  };
  portfolio: TokenHolding[];
  totalBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenHolding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  value: number;
  priceChange24h: number;
  assetType: 'real-estate' | 'art' | 'music' | 'gaming';
  tokenAddress?: string;
  purchaseDate: Date;
  purchasePrice: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'buy' | 'sell' | 'dividend' | 'transfer';
  assetId: string;
  assetSymbol: string;
  amount: number;
  price: number;
  total: number;
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface TokenizedAsset {
  id: string;
  name: string;
  symbol: string;
  description: string;
  assetType: 'real-estate' | 'art' | 'music' | 'gaming';
  totalValue: number;
  totalSupply: number;
  availableSupply: number;
  minInvestment: number;
  expectedROI: number;
  currentPrice: number;
  creatorId: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  documents: string[];
  contractAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  static auth = auth;

  static async signUp(email: string, password: string): Promise<FirebaseUser> {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        uid: `demo-user-${Date.now()}`,
        email,
        displayName: null,
        photoURL: null
      } as FirebaseUser;
    }
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  static async signIn(email: string, password: string): Promise<FirebaseUser> {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        uid: 'demo-user-123',
        email,
        displayName: 'Demo User',
        photoURL: null
      } as FirebaseUser;
    }
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  static async signOut(): Promise<void> {
    if (isDemoMode()) {
      console.log('Demo sign out');
      return;
    }
    
    await auth.signOut();
  }

  static getCurrentUser(): FirebaseUser | null {
    if (isDemoMode()) {
      return {
        uid: 'demo-user-123',
        email: 'demo@tokenvault.com',
        displayName: 'Demo User',
        photoURL: null
      } as FirebaseUser;
    }
    
    return auth.currentUser;
  }

  static async resetPassword(email: string): Promise<void> {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
    
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  }

  static async updateProfile(displayName?: string, photoURL?: string): Promise<void> {
    if (isDemoMode()) {
      return;
    }
    
    const { updateProfile } = await import('firebase/auth');
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { displayName, photoURL });
    }
  }
}

export class UserService {
  // Проверка на ожидаемые офлайн ошибки
  static isOfflineError(error: any): boolean {
    const offlineMessages = [
      'client is offline',
      'failed to get document because the client is offline',
      'offline',
      'unavailable',
      'deadline-exceeded'
    ];
    
    if (error.code && ['unavailable', 'deadline-exceeded', 'offline'].includes(error.code)) {
      return true;
    }
    
    if (error.message) {
      const message = error.message.toLowerCase();
      return offlineMessages.some(msg => message.includes(msg));
    }
    
    return false;
  }

  static async createUserProfile(user: FirebaseUser, walletAddress?: string): Promise<void> {
    if (isDemoMode()) {
      await DemoServices.UserService.createUserProfile(user.uid, user.email!, walletAddress);
      return;
    }

    const userProfile: UserProfile = {
      id: user.uid,
      email: user.email!,
      walletAddress: walletAddress || null,
      isKYCVerified: false,
      portfolio: [
        {
          id: 'starter-real-estate-1',
          symbol: 'REAL',
          name: 'Стартовая недвижимость',
          amount: 10,
          value: 5000,
          priceChange24h: 1.5,
          assetType: 'real-estate',
          purchaseDate: new Date(),
          purchasePrice: 500
        }
      ],
      totalBalance: 5000,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const cleanProfile = Object.fromEntries(
      Object.entries(userProfile).filter(([_, v]) => v !== undefined)
    );

    try {
      await setDoc(doc(db, 'users', user.uid), cleanProfile);
      console.log('User profile created successfully');
    } catch (error: any) {
      const isOfflineError = UserService.isOfflineError(error);
      
      if (isOfflineError) {
        console.log('📱 Profile creation queued - will sync when online');
      } else {
        console.warn('Firebase createUserProfile error:', error.message);
      }
      
      await AppModeManager.handleFirebaseError(error, 'createUserProfile');
      // В демо режиме профиль создастся автоматически
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (isDemoMode()) {
      return await DemoServices.UserService.getUserProfile(userId);
    }

    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        return {
          ...data,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        };
      }
      return null;
    } catch (error: any) {
      // Проверяем на ожидаемые офлайн ошибки
      const isOfflineError = UserService.isOfflineError(error);
      
      if (isOfflineError) {
        // Для офлайн ошибок только предупреждение в консоль
        console.log('📱 Working offline - using cached/demo data');
      } else {
        // Для других ошибок показываем полное сообщение
        console.warn('Firebase getUserProfile error:', error.message);
      }
      
      await AppModeManager.handleFirebaseError(error, 'getUserProfile');
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    if (isDemoMode()) {
      await DemoServices.UserService.updateUserProfile(userId, updates);
      return;
    }

    const cleanUpdates = Object.fromEntries(
      Object.entries({
        ...updates,
        updatedAt: new Date()
      }).filter(([_, v]) => v !== undefined)
    );

    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, cleanUpdates);
      console.log('User profile updated successfully');
    } catch (error: any) {
      const isOfflineError = UserService.isOfflineError(error);
      
      if (isOfflineError) {
        console.log('📱 Profile update queued - will sync when online');
      } else {
        console.warn('Firebase updateUserProfile error:', error.message);
      }
      
      await AppModeManager.handleFirebaseError(error, 'updateUserProfile');
      // В демо режиме обновления будут работать локально
    }
  }

  static async updateKYCData(userId: string, kycData: UserProfile['kycData']): Promise<void> {
    await this.updateUserProfile(userId, {
      kycData,
      isKYCVerified: false
    });
  }

  static async verifyKYC(userId: string): Promise<void> {
    await this.updateUserProfile(userId, {
      isKYCVerified: true
    });
  }
}

export class AssetService {
  static async createTokenizedAsset(asset: Omit<TokenizedAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (isDemoMode()) {
      return await DemoServices.AssetService.createTokenizedAsset(asset);
    }

    const docRef = doc(collection(db, 'assets'));
    const assetData: TokenizedAsset = {
      ...asset,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(docRef, assetData);
    return docRef.id;
  }

  static async getTokenizedAsset(assetId: string): Promise<TokenizedAsset | null> {
    if (isDemoMode()) {
      return null;
    }

    try {
      const docRef = doc(db, 'assets', assetId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as TokenizedAsset;
      }
      return null;
    } catch (error) {
      console.error('Error getting asset:', error);
      return null;
    }
  }

  static async getAssetsByType(assetType: string): Promise<TokenizedAsset[]> {
    if (isDemoMode()) {
      return [];
    }

    try {
      const q = query(collection(db, 'assets'), where('assetType', '==', assetType));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as TokenizedAsset);
    } catch (error) {
      console.error('Error getting assets by type:', error);
      return [];
    }
  }

  static async getVerifiedAssets(): Promise<TokenizedAsset[]> {
    if (isDemoMode()) {
      return await DemoServices.AssetService.getVerifiedAssets();
    }

    try {
      const q = query(collection(db, 'assets'), where('verificationStatus', '==', 'verified'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as TokenizedAsset);
    } catch (error) {
      console.error('Error getting verified assets:', error);
      return [];
    }
  }

  static async updateAssetPrice(assetId: string, newPrice: number): Promise<void> {
    if (isDemoMode()) {
      return;
    }

    try {
      const docRef = doc(db, 'assets', assetId);
      await updateDoc(docRef, {
        currentPrice: newPrice,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating asset price:', error);
    }
  }
}

export class TransactionService {
  static async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
    if (isDemoMode()) {
      return await DemoServices.TransactionService.createTransaction(transaction);
    }

    const docRef = doc(collection(db, 'transactions'));
    const transactionData: Transaction = {
      ...transaction,
      id: docRef.id,
      createdAt: new Date()
    };

    await setDoc(docRef, transactionData);
    return docRef.id;
  }

  static async getUserTransactions(userId: string): Promise<Transaction[]> {
    if (isDemoMode()) {
      return await DemoServices.TransactionService.getUserTransactions(userId);
    }

    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as Transaction);
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }

  static async updateTransactionStatus(transactionId: string, status: Transaction['status'], txHash?: string): Promise<void> {
    if (isDemoMode()) {
      return;
    }

    try {
      const docRef = doc(db, 'transactions', transactionId);
      const updates: any = { status };
      if (txHash) updates.txHash = txHash;
      
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  }
}

export class MarketplaceService {
  static async getMarketplaceListings(filters?: { assetType?: string; minPrice?: number; maxPrice?: number }): Promise<any[]> {
    if (isDemoMode()) {
      return await DemoServices.MarketplaceService.getMarketplaceListings(filters);
    }

    try {
      let q = query(collection(db, 'marketplace'), where('status', '==', 'active'));
      
      if (filters?.assetType) {
        q = query(q, where('assetType', '==', filters.assetType));
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting marketplace listings:', error);
      return [];
    }
  }

  static async createListing(sellerId: string, listingData: any): Promise<string> {
    if (isDemoMode()) {
      return await DemoServices.MarketplaceService.createListing(sellerId, listingData);
    }

    try {
      const listingsRef = collection(db, 'marketplace');
      const docRef = await addDoc(listingsRef, {
        ...listingData,
        sellerId,
        createdAt: new Date(),
        status: 'active',
        views: 0,
        favorites: 0,
        transactions: []
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  static async purchaseAsset(listingId: string, buyerId: string, amount: number, totalPrice: number): Promise<void> {
    if (isDemoMode()) {
      await DemoServices.MarketplaceService.purchaseAsset(listingId, amount, totalPrice);
      return;
    }

    try {
      const batch = writeBatch(db);
      
      const listingRef = doc(db, 'marketplace', listingId);
      batch.update(listingRef, {
        availableTokens: increment(-amount),
        updatedAt: new Date()
      });
      
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, {
        listingId,
        buyerId,
        amount,
        totalPrice,
        type: 'purchase',
        status: 'completed',
        createdAt: new Date()
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error purchasing asset:', error);
      throw error;
    }
  }
}

export class GovernanceService {
  static async getActiveProposals(): Promise<any[]> {
    if (isDemoMode()) {
      return await DemoServices.GovernanceService.getActiveProposals();
    }

    try {
      const q = query(
        collection(db, 'governance'), 
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting proposals:', error);
      return [];
    }
  }

  static async vote(proposalId: string, userId: string, vote: 'for' | 'against', votingPower: number): Promise<void> {
    if (isDemoMode()) {
      await DemoServices.GovernanceService.vote(proposalId, userId, vote, votingPower);
      return;
    }

    try {
      const batch = writeBatch(db);
      
      const proposalRef = doc(db, 'governance', proposalId);
      const voteField = vote === 'for' ? 'votesFor' : 'votesAgainst';
      
      batch.update(proposalRef, {
        [voteField]: increment(votingPower),
        totalVotes: increment(votingPower),
        totalVoters: increment(1),
        voters: arrayUnion({
          userId,
          vote,
          votingPower,
          timestamp: new Date()
        }),
        updatedAt: new Date()
      });
      
      const voteRef = doc(collection(db, 'votes'));
      batch.set(voteRef, {
        proposalId,
        userId,
        vote,
        votingPower,
        timestamp: new Date()
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  }

  static async createProposal(creatorId: string, proposalData: any): Promise<string> {
    if (isDemoMode()) {
      return await DemoServices.GovernanceService.createProposal(creatorId, proposalData);
    }

    try {
      const proposalsRef = collection(db, 'governance');
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      
      const docRef = await addDoc(proposalsRef, {
        ...proposalData,
        creatorId,
        createdAt: new Date(),
        endDate,
        status: 'active',
        votesFor: 0,
        votesAgainst: 0,
        totalVotes: 0,
        totalVoters: 0,
        voters: []
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }
}

export class NotificationService {
  static async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    if (isDemoMode()) {
      return await DemoServices.NotificationService.getUserNotifications(userId, unreadOnly);
    }

    try {
      let q = query(
        collection(db, 'notifications'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      if (unreadOnly) {
        q = query(q, where('isRead', '==', false));
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    if (isDemoMode()) {
      await DemoServices.NotificationService.markAsRead(notificationId);
      return;
    }

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    if (isDemoMode()) {
      await DemoServices.NotificationService.markAllAsRead(userId);
      return;
    }

    try {
      const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          isRead: true,
          readAt: new Date()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}

export class StorageService {
  static async uploadDocument(file: File, userId: string, documentType: string): Promise<string> {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `https://demo-storage.com/${userId}/${documentType}_${Date.now()}.pdf`;
    }

    try {
      const fileName = `kyc/${userId}/${documentType}_${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  static async uploadAssetDocument(file: File, assetId: string, documentType: string): Promise<string> {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return `https://demo-storage.com/assets/${assetId}/${documentType}_${Date.now()}.pdf`;
    }

    try {
      const fileName = `assets/${assetId}/${documentType}_${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading asset document:', error);
      throw error;
    }
  }
}

export { auth, db, storage };
export default app;