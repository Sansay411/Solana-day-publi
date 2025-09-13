// Mock Authentication Service for Demo Mode
export class MockAuth {
  private currentUser: any = null;
  private authStateCallbacks: Array<(user: any) => void> = [];

  onAuthStateChanged(callback: (user: any) => void) {
    this.authStateCallbacks.push(callback);
    
    // Simulate authentication delay
    setTimeout(() => {
      if (!this.currentUser) {
        this.currentUser = {
          uid: 'demo-user-123',
          email: 'demo@tokenvault.com',
          displayName: 'Demo User',
          photoURL: null
        };
      }
      callback(this.currentUser);
    }, 100);

    // Return unsubscribe function
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
    };
  }

  async signOut() {
    this.currentUser = null;
    this.authStateCallbacks.forEach(callback => callback(null));
  }

  get currentUser() {
    return this.currentUser;
  }
}

export const mockAuth = new MockAuth();