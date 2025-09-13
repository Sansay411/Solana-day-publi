import { SolanaService } from './solana';

export interface GovServicePayment {
  serviceId: string;
  serviceName: string;
  amount: number;
  solAmount: number;
  userInfo: {
    fullName: string;
    passport: string;
    address?: string;
    phone?: string;
  };
  transactionHash: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

export interface GovServiceCategory {
  id: string;
  name: string;
  description: string;
  services: GovServiceItem[];
}

export interface GovServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  processingTime: string;
  requirements: string[];
  isAvailable: boolean;
}

export class GovServicesService {
  private static readonly SERVICES: GovServiceCategory[] = [
    {
      id: 'documents',
      name: 'Документы',
      description: 'Оформление и получение документов',
      services: [
        {
          id: 'passport',
          name: 'Загранпаспорт',
          description: 'Оформление заграничного паспорта РК',
          price: 0.2,
          category: 'Документы',
          processingTime: '30 дней',
          requirements: ['Казахстанское гражданство', 'Фото 3x4 см', 'Старый паспорт (при замене)'],
          isAvailable: true
        },
        {
          id: 'birth-certificate',
          name: 'Свидетельство о рождении',
          description: 'Получение дубликата свидетельства о рождении',
          price: 0.05,
          category: 'Документы',
          processingTime: '10 дней',
          requirements: ['Удостоверение личности заявителя', 'Справка о месте рождения'],
          isAvailable: true
        }
      ]
    },
    {
      id: 'transport',
      name: 'Транспорт',
      description: 'Транспортные услуги и документы',
      services: [
        {
          id: 'driving-license',
          name: 'Водительские права',
          description: 'Получение/замена водительского удостоверения РК',
          price: 0.15,
          category: 'Транспорт',
          processingTime: '10 дней',
          requirements: ['Медицинская справка', 'Сертификат о прохождении курсов', 'Фото 3x4'],
          isAvailable: true
        },
        {
          id: 'vehicle-registration',
          name: 'Регистрация ТС',
          description: 'Постановка транспортного средства на учет в РК',
          price: 0.1,
          category: 'Транспорт',
          processingTime: '1 день',
          requirements: ['Техпаспорт', 'Страховой полис', 'Документы на собственность'],
          isAvailable: true
        }
      ]
    },
    {
      id: 'property',
      name: 'Недвижимость',
      description: 'Операции с недвижимостью',
      services: [
        {
          id: 'property-registration',
          name: 'Регистрация собственности',
          description: 'Оформление права собственности на недвижимость в РК',
          price: 0.5,
          category: 'Недвижимость',
          processingTime: '15 дней',
          requirements: ['Документы на объект', 'Техническая характеристика', 'Договор купли-продажи'],
          isAvailable: true
        },
        {
          id: 'cadastral-extract',
          name: 'Техническая характеристика',
          description: 'Получение технической характеристики объекта недвижимости',
          price: 0.02,
          category: 'Недвижимость',
          processingTime: '3 дня',
          requirements: ['Адрес объекта', 'Кадастровый номер'],
          isAvailable: true
        }
      ]
    },
    {
      id: 'business',
      name: 'Бизнес',
      description: 'Предпринимательская деятельность',
      services: [
        {
          id: 'business-registration',
          name: 'Регистрация ИП',
          description: 'Государственная регистрация индивидуального предпринимателя',
          price: 0.03,
          category: 'Бизнес',
          processingTime: '1 день',
          requirements: ['Удостоверение личности', 'Заявление', 'ИИН'],
          isAvailable: true
        },
        {
          id: 'llc-registration',
          name: 'Регистрация ТОО',
          description: 'Государственная регистрация товарищества с ограниченной ответственностью',
          price: 0.25,
          category: 'Бизнес',
          processingTime: '3 дня',
          requirements: ['Устав', 'Решение о создании', 'Документы учредителей'],
          isAvailable: true
        }
      ]
    },
    {
      id: 'family',
      name: 'Семья и РАГС',
      description: 'Семейные отношения и РАГС',
      services: [
        {
          id: 'marriage-certificate',
          name: 'Свидетельство о браке',
          description: 'Регистрация брака в органах РАГС',
          price: 0.08,
          category: 'РАГС',
          processingTime: '1 месяц',
          requirements: ['Удостоверения личности сторон', 'Заявление о регистрации брака', 'Справка о семейном положении'],
          isAvailable: true
        },
        {
          id: 'divorce-certificate',
          name: 'Свидетельство о разводе',
          description: 'Расторжение брака',
          price: 0.12,
          category: 'РАГС',
          processingTime: '1 месяц',
          requirements: ['Удостоверения личности сторон', 'Свидетельство о браке', 'Заявление о расторжении брака'],
          isAvailable: true
        }
      ]
    }
  ];

  static getAllCategories(): GovServiceCategory[] {
    return this.SERVICES;
  }

  static getServicesByCategory(categoryId: string): GovServiceItem[] {
    const category = this.SERVICES.find(cat => cat.id === categoryId);
    return category ? category.services : [];
  }

  static getServiceById(serviceId: string): GovServiceItem | null {
    for (const category of this.SERVICES) {
      const service = category.services.find(s => s.id === serviceId);
      if (service) return service;
    }
    return null;
  }

  static getAllServices(): GovServiceItem[] {
    return this.SERVICES.flatMap(category => category.services);
  }

  static async processPayment(
    serviceId: string,
    userInfo: {
      fullName: string;
      passport: string;
      address?: string;
      phone?: string;
    }
  ): Promise<GovServicePayment> {
    const service = this.getServiceById(serviceId);
    if (!service) {
      throw new Error('Сервис не найден');
    }

    if (!userInfo.fullName || !userInfo.passport) {
      throw new Error('Необходимо заполнить ФИО и номер удостоверения личности');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const solPrice = await SolanaService.getSolanaPrice();
    const transactionHash = `gov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment: GovServicePayment = {
      serviceId: service.id,
      serviceName: service.name,
      amount: service.price * solPrice,
      solAmount: service.price,
      userInfo,
      transactionHash,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    this.savePaymentToLocalStorage(payment);

    return payment;
  }

  private static savePaymentToLocalStorage(payment: GovServicePayment): void {
    try {
      const existingPayments = this.getPaymentHistory();
      existingPayments.push(payment);
      localStorage.setItem('govservice_payments', JSON.stringify(existingPayments));
    } catch (error) {
      console.warn('Failed to save payment to localStorage:', error);
    }
  }

  static getPaymentHistory(): GovServicePayment[] {
    try {
      const payments = localStorage.getItem('govservice_payments');
      return payments ? JSON.parse(payments) : [];
    } catch (error) {
      console.warn('Failed to load payment history:', error);
      return [];
    }
  }

  static getPaymentById(transactionHash: string): GovServicePayment | null {
    const payments = this.getPaymentHistory();
    return payments.find(p => p.transactionHash === transactionHash) || null;
  }

  static validateUserInfo(userInfo: {
    fullName: string;
    passport: string;
    address?: string;
    phone?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!userInfo.fullName || userInfo.fullName.trim().length < 3) {
      errors.push('ФИО должно содержать минимум 3 символа');
    }

    if (!userInfo.passport) {
      errors.push('Номер удостоверения личности обязателен');
    } else {
      const passportRegex = /^\d{12}$/;
      if (!passportRegex.test(userInfo.passport.replace(/\s/g, ''))) {
        errors.push('Неверный формат удостоверения личности (пример: 123456789012)');
      }
    }

    if (userInfo.phone && userInfo.phone.length > 0) {
      const phoneRegex = /^[\+]?7[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
      if (!phoneRegex.test(userInfo.phone)) {
        errors.push('Неверный формат телефона (пример: +7 701 123 45 67)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static calculateTotalPrice(serviceIds: string[]): { solAmount: number; usdAmount: number } {
    const totalSol = serviceIds.reduce((sum, serviceId) => {
      const service = this.getServiceById(serviceId);
      return sum + (service ? service.price : 0);
    }, 0);

    return {
      solAmount: totalSol,
      usdAmount: totalSol * 100
    };
  }

  static getPopularServices(): GovServiceItem[] {
    const popularServiceIds = ['passport', 'driving-license', 'business-registration', 'marriage-certificate'];
    return popularServiceIds
      .map(id => this.getServiceById(id))
      .filter(service => service !== null) as GovServiceItem[];
  }

  static searchServices(query: string): GovServiceItem[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllServices().filter(service =>
      service.name.toLowerCase().includes(lowercaseQuery) ||
      service.description.toLowerCase().includes(lowercaseQuery) ||
      service.category.toLowerCase().includes(lowercaseQuery)
    );
  }
}