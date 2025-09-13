import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { AlertCircle, Eye, EyeOff, Mail, Lock, User, Wallet, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { AuthService, UserService } from '../services/firebase';
import { SolanaService } from '../services/solana';

interface AuthPageProps {
  onAuthSuccess: (user: any) => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email обязателен';
    if (!emailRegex.test(email)) return 'Неверный формат email';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Пароль обязателен';
    if (password.length < 6) return 'Пароль должен содержать минимум 6 символов';
    if (!/(?=.*[a-z])/.test(password)) return 'Пароль должен содержать строчную букву';
    if (!/(?=.*[A-Z])/.test(password)) return 'Пароль должен содержать заглавную букву';
    if (!/(?=.*\d)/.test(password)) return 'Пароль должен содержать цифру';
    return undefined;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Подтвердите пароль';
    if (password !== confirmPassword) return 'Пароли не совпадают';
    return undefined;
  };

  const validateName = (name: string, fieldName: string): string | undefined => {
    if (!name) return `${fieldName} обязательно`;
    if (name.length < 2) return `${fieldName} должно содержать минимум 2 символа`;
    if (!/^[a-zA-Zа-яёА-ЯЁ\s]+$/.test(name)) return `${fieldName} должно содержать только буквы`;
    return undefined;
  };

  const validateForm = (isSignUp: boolean = false): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Password validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Sign up specific validations
    if (isSignUp) {
      const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

      const firstNameError = validateName(formData.firstName, 'Имя');
      if (firstNameError) newErrors.firstName = firstNameError;

      const lastNameError = validateName(formData.lastName, 'Фамилия');
      if (lastNameError) newErrors.lastName = lastNameError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const user = await AuthService.signIn(formData.email, formData.password);
      
      // Get user profile from Firestore
      const userProfile = await UserService.getUserProfile(user.uid);
      
      if (!userProfile) {
        // Create basic profile if doesn't exist
        await UserService.createUserProfile(user);
        toast.success('Добро пожаловать! Создан новый профиль.');
      } else {
        toast.success(`Добро пожаловать, ${userProfile.email}!`);
      }

      // Load complete user data
      const completeProfile = await UserService.getUserProfile(user.uid);
      onAuthSuccess(completeProfile || {
        id: user.uid,
        email: user.email!,
        isKYCVerified: false,
        portfolio: [],
        totalBalance: 0
      });

    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = 'Произошла ошибка при входе';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Пользователь с таким email не найден';
          setErrors({ email: errorMessage });
          break;
        case 'auth/wrong-password':
          errorMessage = 'Неверный пароль';
          setErrors({ password: errorMessage });
          break;
        case 'auth/invalid-email':
          errorMessage = 'Неверный формат email';
          setErrors({ email: errorMessage });
          break;
        case 'auth/user-disabled':
          errorMessage = 'Аккаунт заблокирован';
          setErrors({ general: errorMessage });
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Слишком много попыток входа. Попробуйте позже';
          setErrors({ general: errorMessage });
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
          setErrors({ general: errorMessage });
          break;
        default:
          setErrors({ general: errorMessage });
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm(true)) return;

    setIsLoading(true);
    setErrors({});

    try {
      const user = await AuthService.signUp(formData.email, formData.password);
      
      // Create user profile in Firestore
      await UserService.createUserProfile(user);
      
      // Update profile with additional info
      await UserService.updateUserProfile(user.uid, {
        kycData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: '',
          nationality: '',
          address: '',
          phone: '',
          idNumber: '',
          idType: 'passport'
        }
      });

      toast.success(`Аккаунт создан! Добро пожаловать, ${formData.firstName}!`);
      
      // Get complete profile
      const userProfile = await UserService.getUserProfile(user.uid);
      onAuthSuccess(userProfile || {
        id: user.uid,
        email: user.email!,
        isKYCVerified: false,
        portfolio: [],
        totalBalance: 0
      });

    } catch (error: any) {
      console.error('Sign up error:', error);
      
      let errorMessage = 'Произошла ошибка при регистрации';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Пользователь с таким email уже существует';
          setErrors({ email: errorMessage });
          break;
        case 'auth/invalid-email':
          errorMessage = 'Неверный формат email';
          setErrors({ email: errorMessage });
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Регистрация временно недоступна';
          setErrors({ general: errorMessage });
          break;
        case 'auth/weak-password':
          errorMessage = 'Пароль слишком простой';
          setErrors({ password: errorMessage });
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
          setErrors({ general: errorMessage });
          break;
        default:
          setErrors({ general: errorMessage });
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    setConnectingWallet(true);
    
    try {
      const wallet = await SolanaService.connectPhantomWallet();
      
      toast.success('Phantom Wallet подключен!', {
        description: `Адрес: ${wallet.publicKey.toString().slice(0, 8)}...`,
      });

      // Continue with email auth after wallet connection
      toast.info('Теперь войдите в аккаунт или зарегистрируйтесь');
      
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      if (error.message.includes('not found')) {
        toast.error('Phantom Wallet не найден', {
          description: 'Установите расширение Phantom Wallet'
        });
      } else if (error.message.includes('rejected')) {
        toast.error('Подключение отклонено пользователем');
      } else {
        toast.error('Ошибка подключения кошелька');
      }
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: 'Введите email для сброса пароля' });
      return;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    try {
      await AuthService.resetPassword(formData.email);
      toast.success('Письмо для сброса пароля отправлено!', {
        description: 'Проверьте вашу почту'
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Ошибка сброса пароля';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Пользователь с таким email не найден';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Неверный формат email';
          break;
        default:
          errorMessage = 'Ошибка сброса пароля';
      }
      
      toast.error(errorMessage);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    
    try {
      // Demo user data
      const demoUser = {
        id: 'demo-user',
        email: 'demo@tokenvault.com',
        walletAddress: '9WJd4K2pG8HnL3M7vX9rE6tN8qA1sF3cV5bH2dJ4kP8C',
        isKYCVerified: true,
        totalBalance: 11300.04,
        portfolio: [
          {
            id: '1',
            symbol: 'REIT1',
            name: 'Manhattan Luxury Property',
            amount: 1500.32,
            value: 7800.45,
            priceChange24h: 2.3,
            assetType: 'real-estate' as const
          },
          {
            id: '2',
            symbol: 'ART1',
            name: 'Digital Art Collection',
            amount: 250.0,
            value: 2100.30,
            priceChange24h: -1.2,
            assetType: 'art' as const
          },
          {
            id: '3',
            symbol: 'MUSIC1',
            name: 'Royalty Rights Token',
            amount: 500.0,
            value: 1400.29,
            priceChange24h: 5.7,
            assetType: 'music' as const
          }
        ]
      };

      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Вход в демо-режиме!', {
        description: 'Все функции доступны для тестирования'
      });
      
      onAuthSuccess(demoUser);
    } catch (error) {
      toast.error('Ошибка входа в демо-режиме');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">TokenVault</h1>
          <p className="text-gray-600">Платформа токенизации активов</p>
        </div>

        {/* Wallet Connect Button */}
        <div className="space-y-3">
          <Button
            onClick={handleWalletConnect}
            disabled={connectingWallet}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-3 rounded-xl"
          >
            {connectingWallet ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Подключение...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Подключить Phantom Wallet
              </>
            )}
          </Button>
          
          <div className="relative">
            <Separator className="my-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-2 text-sm text-gray-500">или</span>
            </div>
          </div>
        </div>

        {/* Auth Tabs */}
        <Card className="p-6 shadow-xl border-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>

            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{errors.general}</span>
              </div>
            )}

            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введите пароль"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              <Button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                  disabled={isLoading}
                >
                  Забыли пароль?
                </button>
              </div>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstName">Имя</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="signup-firstName"
                      placeholder="Иван"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-lastName">Фамилия</Label>
                  <Input
                    id="signup-lastName"
                    placeholder="Петров"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Минимум 6 символов"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirmPassword">Подтвердите пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="signup-confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Повторите пароль"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              <Button
                onClick={handleSignUp}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Создание аккаунта...
                  </>
                ) : (
                  'Создать аккаунт'
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Demo Login */}
        <div className="text-center">
          <Separator className="my-4" />
          <Button
            variant="outline"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full border-dashed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                Загрузка...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Войти в демо-режиме
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            Продолжая, вы соглашаетесь с{' '}
            <span className="text-blue-600 underline cursor-pointer">Условиями использования</span>
            {' '}и{' '}
            <span className="text-blue-600 underline cursor-pointer">Политикой конфиденциальности</span>
          </p>
        </div>
      </div>
    </div>
  );
}