import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { NavigationPage, User } from '../App';
import { 
  ArrowLeft, 
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  MessageSquare,
  Calendar,
  AlertCircle,
  Award,
  Activity
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface GovernancePageProps {
  user: User;
  onNavigate: (page: NavigationPage) => void;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: 'investment' | 'management' | 'dividend' | 'governance';
  assetId?: string;
  assetName?: string;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  endDate: string;
  proposer: string;
  userVote?: 'for' | 'against' | null;
  requiredTokens: number;
  currentUserTokens: number;
}

interface GovernanceStats {
  totalProposals: number;
  userVotes: number;
  votingPower: number;
  participationRate: number;
}

const mockProposals: Proposal[] = [
  {
    id: '1',
    title: 'Реновация офисного здания в Манхэттене',
    description: 'Предложение о проведении капитального ремонта офисного здания для увеличения арендной стоимости и привлечения новых арендаторов.',
    type: 'investment',
    assetId: '1',
    assetName: 'Manhattan Luxury Property',
    status: 'active',
    votesFor: 1250,
    votesAgainst: 380,
    totalVotes: 1630,
    quorum: 2000,
    endDate: '2024-04-15',
    proposer: 'Real Estate Management',
    userVote: null,
    requiredTokens: 100,
    currentUserTokens: 1500
  },
  {
    id: '2',
    title: 'Распределение дивидендов Q1 2024',
    description: 'Голосование по размеру дивидендных выплат за первый квартал 2024 года по токенам музыкальных прав.',
    type: 'dividend',
    assetId: '3',
    assetName: 'Royalty Rights Token',
    status: 'active',
    votesFor: 890,
    votesAgainst: 150,
    totalVotes: 1040,
    quorum: 1500,
    endDate: '2024-04-10',
    proposer: 'Music Rights DAO',
    userVote: 'for',
    requiredTokens: 50,
    currentUserTokens: 500
  },
  {
    id: '3',
    title: 'Смена управляющей компании',
    description: 'Предложение о смене управляющей компании для коллекции цифрового искусства с целью улучшения маркетинговой стратегии.',
    type: 'management',
    assetId: '2',
    assetName: 'Digital Art Collection',
    status: 'passed',
    votesFor: 2100,
    votesAgainst: 450,
    totalVotes: 2550,
    quorum: 2000,
    endDate: '2024-03-25',
    proposer: 'ArtistDAO Community',
    userVote: 'for',
    requiredTokens: 25,
    currentUserTokens: 250
  },
  {
    id: '4',
    title: 'Изменение протокола голосования',
    description: 'Предложение об изменении минимального кворума для принятия решений с 50% до 40% от общего количества токенов.',
    type: 'governance',
    status: 'rejected',
    votesFor: 800,
    votesAgainst: 1200,
    totalVotes: 2000,
    quorum: 2000,
    endDate: '2024-03-20',
    proposer: 'Community Member',
    userVote: 'against',
    requiredTokens: 10,
    currentUserTokens: 2000
  }
];

const governanceStats: GovernanceStats = {
  totalProposals: 24,
  userVotes: 18,
  votingPower: 2250,
  participationRate: 75
};

const proposalTypeInfo = {
  investment: { name: 'Инвестиции', color: 'blue', icon: TrendingUp },
  management: { name: 'Управление', color: 'purple', icon: Users },
  dividend: { name: 'Дивиденды', color: 'green', icon: Award },
  governance: { name: 'Управление', color: 'orange', icon: Vote }
};

export function GovernancePage({ user, onNavigate }: GovernancePageProps) {
  const [selectedTab, setSelectedTab] = useState('active');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const handleVote = (proposalId: string, vote: 'for' | 'against') => {
    // В реальном приложении здесь будет вызов smart contract
    toast.success(`Голос "${vote === 'for' ? 'ЗА' : 'ПРОТИВ'}" принят`);
    
    // Update proposal locally (в реальном приложении данные будут обновляться с блокчейна)
    const updatedProposals = mockProposals.map(p => 
      p.id === proposalId 
        ? { 
            ...p, 
            userVote: vote,
            votesFor: vote === 'for' ? p.votesFor + 1 : p.votesFor,
            votesAgainst: vote === 'against' ? p.votesAgainst + 1 : p.votesAgainst,
            totalVotes: p.totalVotes + 1
          }
        : p
    );
  };

  const getProposalsForTab = (tab: string) => {
    switch (tab) {
      case 'active':
        return mockProposals.filter(p => p.status === 'active');
      case 'completed':
        return mockProposals.filter(p => p.status === 'passed' || p.status === 'rejected' || p.status === 'executed');
      case 'my-votes':
        return mockProposals.filter(p => p.userVote !== null && p.userVote !== undefined);
      default:
        return mockProposals;
    }
  };

  const calculateProgress = (proposal: Proposal) => {
    return (proposal.totalVotes / proposal.quorum) * 100;
  };

  const canVote = (proposal: Proposal) => {
    return proposal.status === 'active' && 
           proposal.currentUserTokens >= proposal.requiredTokens &&
           !proposal.userVote;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (selectedProposal) {
    const typeInfo = proposalTypeInfo[selectedProposal.type];
    const IconComponent = typeInfo.icon;
    const progress = calculateProgress(selectedProposal);
    const supportPercentage = (selectedProposal.votesFor / selectedProposal.totalVotes) * 100;
    
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="flex items-center p-4 pt-12 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedProposal(null)}
            className="mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Детали предложения</h1>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Proposal Header */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`bg-${typeInfo.color}-50 text-${typeInfo.color}-700`}>
                  <IconComponent className="w-3 h-3 mr-1" />
                  {typeInfo.name}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`${
                    selectedProposal.status === 'active' ? 'bg-blue-50 text-blue-700' :
                    selectedProposal.status === 'passed' ? 'bg-green-50 text-green-700' :
                    selectedProposal.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-gray-50 text-gray-700'
                  }`}
                >
                  {selectedProposal.status === 'active' ? 'Активно' :
                   selectedProposal.status === 'passed' ? 'Принято' :
                   selectedProposal.status === 'rejected' ? 'Отклонено' : 'Исполнено'}
                </Badge>
              </div>
              
              <h2 className="font-semibold text-lg">{selectedProposal.title}</h2>
              
              {selectedProposal.assetName && (
                <p className="text-sm text-gray-600">
                  Актив: {selectedProposal.assetName}
                </p>
              )}
              
              <p className="text-gray-700">{selectedProposal.description}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Предложил: {selectedProposal.proposer}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>До: {formatDate(selectedProposal.endDate)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Voting Progress */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Ход голосования</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Прогресс кворума</span>
                  <span className="text-sm font-semibold">
                    {selectedProposal.totalVotes.toLocaleString()} / {selectedProposal.quorum.toLocaleString()}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">
                  {progress.toFixed(1)}% от необходимого кворума
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-semibold text-green-600">
                    {selectedProposal.votesFor.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Голосов ЗА</p>
                  <p className="text-xs text-green-600">
                    {supportPercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-semibold text-red-600">
                    {selectedProposal.votesAgainst.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Голосов ПРОТИВ</p>
                  <p className="text-xs text-red-600">
                    {(100 - supportPercentage).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* User Vote Status */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Ваш статус</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ваша голосующая сила</span>
                <span className="font-semibold">{selectedProposal.currentUserTokens.toLocaleString()} токенов</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Требуется для голосования</span>
                <span className="font-semibold">{selectedProposal.requiredTokens.toLocaleString()} токенов</span>
              </div>
              
              {selectedProposal.userVote ? (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">
                    Вы проголосовали: <strong>{selectedProposal.userVote === 'for' ? 'ЗА' : 'ПРОТИВ'}</strong>
                  </span>
                </div>
              ) : canVote(selectedProposal) ? (
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <Vote className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Вы можете проголосовать</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm">
                    {selectedProposal.currentUserTokens < selectedProposal.requiredTokens 
                      ? 'Недостаточно токенов для голосования'
                      : 'Голосование недоступно'}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Voting Buttons */}
        {canVote(selectedProposal) && (
          <div className="p-4 border-t">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleVote(selectedProposal.id, 'against')}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Против
              </Button>
              <Button
                onClick={() => handleVote(selectedProposal.id, 'for')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                За
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 pt-12 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('home')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Управление</h1>
      </div>

      {/* Stats Cards */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 text-center">
            <Vote className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Голосующая сила</p>
            <p className="font-semibold">{governanceStats.votingPower.toLocaleString()}</p>
          </Card>
          <Card className="p-3 text-center">
            <Activity className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Участие</p>
            <p className="font-semibold">{governanceStats.participationRate}%</p>
          </Card>
          <Card className="p-3 text-center">
            <MessageSquare className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Всего предложений</p>
            <p className="font-semibold">{governanceStats.totalProposals}</p>
          </Card>
          <Card className="p-3 text-center">
            <CheckCircle className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Ваши голоса</p>
            <p className="font-semibold">{governanceStats.userVotes}</p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 grid w-full grid-cols-3">
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
          <TabsTrigger value="my-votes">Мои голоса</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="flex-1 p-4 space-y-3 overflow-y-auto">
          {getProposalsForTab(selectedTab).map((proposal) => {
            const typeInfo = proposalTypeInfo[proposal.type];
            const IconComponent = typeInfo.icon;
            const progress = calculateProgress(proposal);
            const supportPercentage = proposal.totalVotes > 0 
              ? (proposal.votesFor / proposal.totalVotes) * 100 
              : 0;

            return (
              <Card 
                key={proposal.id} 
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProposal(proposal)}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`bg-${typeInfo.color}-50 text-${typeInfo.color}-700`}>
                      <IconComponent className="w-3 h-3 mr-1" />
                      {typeInfo.name}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      {proposal.userVote && (
                        <Badge variant="outline" className="text-xs">
                          {proposal.userVote === 'for' ? '✓ ЗА' : '✗ ПРОТИВ'}
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          proposal.status === 'active' ? 'bg-blue-50 text-blue-700' :
                          proposal.status === 'passed' ? 'bg-green-50 text-green-700' :
                          proposal.status === 'rejected' ? 'bg-red-50 text-red-700' :
                          'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {proposal.status === 'active' ? 'Активно' :
                         proposal.status === 'passed' ? 'Принято' :
                         proposal.status === 'rejected' ? 'Отклонено' : 'Исполнено'}
                      </Badge>
                    </div>
                  </div>

                  {/* Title and Asset */}
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{proposal.title}</h3>
                    {proposal.assetName && (
                      <p className="text-xs text-gray-600 mb-2">Актив: {proposal.assetName}</p>
                    )}
                    <p className="text-xs text-gray-700 line-clamp-2">{proposal.description}</p>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Прогресс голосования</span>
                      <span className="text-xs">
                        {proposal.totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-4">
                      <span className="text-green-600">
                        ЗА: {proposal.votesFor.toLocaleString()} ({supportPercentage.toFixed(1)}%)
                      </span>
                      <span className="text-red-600">
                        ПРОТИВ: {proposal.votesAgainst.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(proposal.endDate)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {getProposalsForTab(selectedTab).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Vote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Нет предложений в этой категории</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}