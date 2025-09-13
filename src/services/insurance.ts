// Insurance Services for Asset Protection
// Страхование токенизированных активов

export interface InsurancePolicy {
  id: string;
  assetId: string;
  assetType: 'real-estate' | 'art' | 'music' | 'gaming';
  policyType: 'comprehensive' | 'partial' | 'catastrophic' | 'smart-contract';
  coverageAmount: number;
  premium: number;
  premiumPeriod: 'monthly' | 'quarterly' | 'annually';
  deductible: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'pending' | 'expired' | 'cancelled' | 'claimed';
  provider: string;
  terms: string[];
  exclusions: string[];
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  assetId: string;
  claimType: 'theft' | 'damage' | 'fraud' | 'smart-contract-failure' | 'market-manipulation';
  claimAmount: number;
  description: string;
  evidence: string[];
  status: 'submitted' | 'under-review' | 'approved' | 'denied' | 'paid';
  submittedDate: Date;
  reviewedDate?: Date;
  paidDate?: Date;
  reviewer?: string;
  payoutAmount?: number;
}

export interface RiskAssessment {
  assetId: string;
  assetType: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    smartContractRisk: number;
    marketRisk: number;
    liquidityRisk: number;
    operationalRisk: number;
    regulatoryRisk: number;
  };
  recommendations: string[];
  lastAssessed: Date;
}

export interface InsuranceQuote {
  assetId: string;
  assetValue: number;
  coverageAmount: number;
  annualPremium: number;
  monthlyPremium: number;
  deductible: number;
  riskScore: number;
  validUntil: Date;
  terms: string[];
  exclusions: string[];
}

// Insurance Service Class
export class InsuranceService {
  private static readonly INSURANCE_PROVIDERS = [
    'CryptoGuard Insurance',
    'BlockChain Protection Co.',
    'Digital Asset Insurance Ltd.',
    'TokenSafe Coverage'
  ];

  // Risk Assessment
  static async assessRisk(assetId: string, assetType: string, assetValue: number): Promise<RiskAssessment> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Симуляция анализа
      
      // Mock risk calculation based on asset type
      const riskFactors = {
        'real-estate': {
          smartContractRisk: 15,
          marketRisk: 25,
          liquidityRisk: 35,
          operationalRisk: 20,
          regulatoryRisk: 30
        },
        'art': {
          smartContractRisk: 20,
          marketRisk: 45,
          liquidityRisk: 50,
          operationalRisk: 25,
          regulatoryRisk: 35
        },
        'music': {
          smartContractRisk: 10,
          marketRisk: 30,
          liquidityRisk: 25,
          operationalRisk: 15,
          regulatoryRisk: 20
        },
        'gaming': {
          smartContractRisk: 25,
          marketRisk: 55,
          liquidityRisk: 40,
          operationalRisk: 30,
          regulatoryRisk: 45
        }
      };

      const factors = riskFactors[assetType as keyof typeof riskFactors] || riskFactors['real-estate'];
      const riskScore = Math.round((factors.smartContractRisk + factors.marketRisk + factors.liquidityRisk + factors.operationalRisk + factors.regulatoryRisk) / 5);
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore < 20) riskLevel = 'low';
      else if (riskScore < 35) riskLevel = 'medium';
      else if (riskScore < 50) riskLevel = 'high';
      else riskLevel = 'critical';

      const recommendations = this.generateRecommendations(riskLevel, assetType);

      const assessment: RiskAssessment = {
        assetId,
        assetType,
        riskScore,
        riskLevel,
        factors,
        recommendations,
        lastAssessed: new Date()
      };

      return assessment;
    } catch (error) {
      console.error('Error assessing risk:', error);
      throw error;
    }
  }

  // Get Insurance Quote
  static async getInsuranceQuote(
    assetId: string,
    assetValue: number,
    coverageAmount: number,
    assetType: string
  ): Promise<InsuranceQuote> {
    try {
      const riskAssessment = await this.assessRisk(assetId, assetType, assetValue);
      
      // Calculate premium based on risk
      const basePremiumRate = 0.02; // 2% base rate
      const riskMultiplier = 1 + (riskAssessment.riskScore / 100);
      const coverageRatio = coverageAmount / assetValue;
      
      const annualPremium = coverageAmount * basePremiumRate * riskMultiplier * coverageRatio;
      const monthlyPremium = annualPremium / 12;
      const deductible = Math.max(1000, coverageAmount * 0.05); // 5% deductible, minimum $1000

      const quote: InsuranceQuote = {
        assetId,
        assetValue,
        coverageAmount,
        annualPremium: Math.round(annualPremium),
        monthlyPremium: Math.round(monthlyPremium),
        deductible: Math.round(deductible),
        riskScore: riskAssessment.riskScore,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        terms: this.getStandardTerms(assetType),
        exclusions: this.getStandardExclusions(assetType)
      };

      return quote;
    } catch (error) {
      console.error('Error getting insurance quote:', error);
      throw error;
    }
  }

  // Purchase Insurance Policy
  static async purchasePolicy(
    assetId: string,
    coverageAmount: number,
    policyType: InsurancePolicy['policyType'],
    premiumPeriod: InsurancePolicy['premiumPeriod'],
    userId: string
  ): Promise<InsurancePolicy> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Симуляция обработки

      const provider = this.INSURANCE_PROVIDERS[Math.floor(Math.random() * this.INSURANCE_PROVIDERS.length)];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year coverage

      const policy: InsurancePolicy = {
        id: `policy_${Date.now()}`,
        assetId,
        assetType: 'real-estate', // Should be determined from asset
        policyType,
        coverageAmount,
        premium: 2400, // From quote
        premiumPeriod,
        deductible: 5000,
        startDate,
        endDate,
        status: 'active',
        provider,
        terms: this.getStandardTerms('real-estate'),
        exclusions: this.getStandardExclusions('real-estate')
      };

      console.log(`Insurance policy created: ${policy.id}`);
      return policy;
    } catch (error) {
      console.error('Error purchasing policy:', error);
      throw error;
    }
  }

  // Submit Insurance Claim
  static async submitClaim(
    policyId: string,
    assetId: string,
    claimType: InsuranceClaim['claimType'],
    claimAmount: number,
    description: string,
    evidence: string[]
  ): Promise<InsuranceClaim> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const claim: InsuranceClaim = {
        id: `claim_${Date.now()}`,
        policyId,
        assetId,
        claimType,
        claimAmount,
        description,
        evidence,
        status: 'submitted',
        submittedDate: new Date()
      };

      console.log(`Insurance claim submitted: ${claim.id}`);
      return claim;
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  }

  // Get User Policies
  static async getUserPolicies(userId: string): Promise<InsurancePolicy[]> {
    try {
      // Mock user policies
      const mockPolicies: InsurancePolicy[] = [
        {
          id: 'policy_001',
          assetId: '1',
          assetType: 'real-estate',
          policyType: 'comprehensive',
          coverageAmount: 1000000,
          premium: 24000,
          premiumPeriod: 'annually',
          deductible: 50000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          status: 'active',
          provider: 'CryptoGuard Insurance',
          terms: this.getStandardTerms('real-estate'),
          exclusions: this.getStandardExclusions('real-estate')
        },
        {
          id: 'policy_002',
          assetId: '2',
          assetType: 'art',
          policyType: 'partial',
          coverageAmount: 20000,
          premium: 2400,
          premiumPeriod: 'annually',
          deductible: 1000,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2025-01-31'),
          status: 'active',
          provider: 'Digital Asset Insurance Ltd.',
          terms: this.getStandardTerms('art'),
          exclusions: this.getStandardExclusions('art')
        }
      ];

      return mockPolicies;
    } catch (error) {
      console.error('Error getting user policies:', error);
      return [];
    }
  }

  // Get User Claims
  static async getUserClaims(userId: string): Promise<InsuranceClaim[]> {
    try {
      // Mock user claims
      const mockClaims: InsuranceClaim[] = [
        {
          id: 'claim_001',
          policyId: 'policy_001',
          assetId: '1',
          claimType: 'damage',
          claimAmount: 15000,
          description: 'Water damage to property due to plumbing failure',
          evidence: ['damage_photos.jpg', 'repair_estimate.pdf'],
          status: 'approved',
          submittedDate: new Date('2024-03-01'),
          reviewedDate: new Date('2024-03-15'),
          paidDate: new Date('2024-03-20'),
          reviewer: 'Claims Adjuster Smith',
          payoutAmount: 13500
        }
      ];

      return mockClaims;
    } catch (error) {
      console.error('Error getting user claims:', error);
      return [];
    }
  }

  // Smart Contract Insurance
  static async getSmartContractInsurance(contractAddress: string): Promise<{
    isInsured: boolean;
    coverageAmount: number;
    premium: number;
    risks: string[];
  }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        isInsured: true,
        coverageAmount: 500000,
        premium: 5000,
        risks: [
          'Smart contract bugs',
          'Oracle manipulation',
          'Governance attacks',
          'Flash loan exploits'
        ]
      };
    } catch (error) {
      console.error('Error getting smart contract insurance:', error);
      throw error;
    }
  }

  // Private helper methods
  private static generateRecommendations(riskLevel: string, assetType: string): string[] {
    const recommendations: { [key: string]: string[] } = {
      low: [
        'Consider basic coverage for protection',
        'Regular monitoring is sufficient',
        'Review policy annually'
      ],
      medium: [
        'Comprehensive insurance recommended',
        'Implement additional security measures',
        'Regular risk assessments advised',
        'Consider diversification'
      ],
      high: [
        'High coverage insurance essential',
        'Enhanced security protocols required',
        'Frequent monitoring necessary',
        'Risk mitigation strategies critical',
        'Consider reducing exposure'
      ],
      critical: [
        'Maximum insurance coverage required',
        'Immediate risk mitigation needed',
        'Consider asset liquidation',
        'Expert consultation recommended',
        'Enhanced due diligence required'
      ]
    };

    return recommendations[riskLevel] || recommendations.medium;
  }

  private static getStandardTerms(assetType: string): string[] {
    const commonTerms = [
      'Policy holder must maintain asset in good condition',
      'Claims must be reported within 30 days',
      'Independent assessment required for claims over $10,000',
      'Coverage subject to annual review'
    ];

    const assetSpecificTerms: { [key: string]: string[] } = {
      'real-estate': [
        'Property must be professionally managed',
        'Regular inspections required',
        'Tenant screening documentation needed'
      ],
      'art': [
        'Professional storage required',
        'Authentication certificates needed',
        'Climate-controlled environment mandatory'
      ],
      'music': [
        'Streaming platform compliance required',
        'Rights documentation must be current',
        'Royalty tracking system needed'
      ],
      'gaming': [
        'Game platform operational status monitored',
        'Asset utility must be maintained',
        'Smart contract audits required'
      ]
    };

    return [...commonTerms, ...(assetSpecificTerms[assetType] || [])];
  }

  private static getStandardExclusions(assetType: string): string[] {
    const commonExclusions = [
      'War and terrorism',
      'Nuclear events',
      'Intentional damage by policy holder',
      'Regulatory changes making asset illegal'
    ];

    const assetSpecificExclusions: { [key: string]: string[] } = {
      'real-estate': [
        'Natural disasters (separate coverage required)',
        'Zoning law changes',
        'Eminent domain'
      ],
      'art': [
        'Market value fluctuations',
        'Changes in artistic taste',
        'Forgery discovered after purchase'
      ],
      'music': [
        'Platform policy changes',
        'Artist reputation damage',
        'Copyright disputes'
      ],
      'gaming': [
        'Game shutdown or major updates',
        'Platform rule changes',
        'Market oversaturation'
      ]
    };

    return [...commonExclusions, ...(assetSpecificExclusions[assetType] || [])];
  }
}

export default InsuranceService;