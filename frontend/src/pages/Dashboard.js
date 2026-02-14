import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Package,
  Truck,
  MessageSquare,
  FileText,
  Star,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, api, isShipper, isCarrier, isCarrierPro, isShipperCarrier } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [stats, setStats] = useState({
    requests: [],
    offers: [],
    contracts: [],
    conversations: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const promises = [
        api.get('/requests/mine?limit=5'),
        api.get('/offers/mine?limit=5'),
        api.get('/contracts'),
        api.get('/conversations')
      ];
      
      // Vérifier le statut de vérification pour les transporteurs
      if (isCarrier) {
        promises.push(api.get('/carriers/verification/status'));
      }
      
      const results = await Promise.all(promises);
      const [requestsRes, offersRes, contractsRes, conversationsRes] = results;

      setStats({
        requests: requestsRes.data.items || [],
        offers: offersRes.data.items || [],
        contracts: contractsRes.data || [],
        conversations: conversationsRes.data || []
      });
      
      if (isCarrier && results[4]) {
        setVerificationStatus(results[4].data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'SHIPPER': return t('auth.shipper');
      case 'CARRIER_INDIVIDUAL': return t('auth.carrier');
      case 'CARRIER_PRO': return t('auth.carrierPro');
      case 'SHIPPER_CARRIER': return t('auth.shipperCarrier') || 'Expéditeur et Transporteur';
      default: return '';
    }
  };

  const getRating = () => {
    if (!user?.rating_count || user.rating_count === 0) return null;
    return (user.rating_sum / user.rating_count).toFixed(1);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      OPEN: { label: t('requests.status.OPEN'), variant: 'default' },
      IN_NEGOTIATION: { label: t('common.pending'), variant: 'secondary' },
      ACCEPTED: { label: t('contracts.status.ACCEPTED'), variant: 'default' },
      IN_TRANSIT: { label: t('common.active'), variant: 'secondary' },
      DELIVERED: { label: t('contracts.status.DELIVERED'), variant: 'default' },
      CANCELLED: { label: t('contracts.status.CANCELLED'), variant: 'destructive' },
      ACTIVE: { label: t('offers.status.ACTIVE'), variant: 'default' },
      PAUSED: { label: t('common.pending'), variant: 'secondary' },
      EXPIRED: { label: t('common.inactive'), variant: 'destructive' },
      PROPOSED: { label: t('contracts.status.PROPOSED'), variant: 'secondary' },
      PICKED_UP: { label: t('contracts.status.PICKED_UP'), variant: 'default' }
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Actions rapides selon le rôle
  const getQuickActions = () => {
    if (isShipperCarrier) {
      // Double rôle: toutes les actions
      return [
        { label: t('requests.new'), icon: PlusCircle, href: '/requests/new', primary: true },
        { label: t('offers.new'), icon: Truck, href: '/offers/new', primary: true },
        { label: t('dashboard.myRequests'), icon: Package, href: '/requests/mine' },
        { label: t('dashboard.myOffers'), icon: Truck, href: '/offers/mine' }
      ];
    } else if (isShipper) {
      return [
        { label: t('requests.new'), icon: PlusCircle, href: '/requests/new', primary: true },
        { label: t('dashboard.myRequests'), icon: Package, href: '/requests/mine' },
        { label: t('requests.findCarrier'), icon: Truck, href: '/offers' }
      ];
    } else {
      return [
        { label: t('offers.new'), icon: PlusCircle, href: '/offers/new', primary: true },
        { label: t('dashboard.myOffers'), icon: Truck, href: '/offers/mine' },
        { label: t('nav.browseRequests'), icon: Package, href: '/requests' }
      ];
    }
  };

  const quickActions = getQuickActions();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8" data-testid="dashboard-page">
      {/* Alerte de vérification d'identité pour les transporteurs */}
      {isCarrier && verificationStatus && verificationStatus.status !== 'VERIFIED' && (
        <Alert className={`rounded-2xl ${
          verificationStatus.status === 'REJECTED' ? 'border-red-200 bg-red-50' :
          verificationStatus.status === 'PENDING' && verificationStatus.documents_complete ? 'border-blue-200 bg-blue-50' :
          'border-orange-200 bg-orange-50'
        }`}>
          <Shield className={`w-5 h-5 ${
            verificationStatus.status === 'REJECTED' ? 'text-red-500' :
            verificationStatus.status === 'PENDING' && verificationStatus.documents_complete ? 'text-blue-500' :
            'text-orange-500'
          }`} />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {verificationStatus.status === 'NOT_STARTED' && (
                <>
                  <strong className="text-orange-700">Vérifiez votre identité pour déposer des offres</strong>
                  <p className="text-sm text-orange-600">
                    Pour la sécurité de notre communauté, vous devez vérifier votre identité avant de pouvoir créer des offres de transport.
                  </p>
                </>
              )}
              {verificationStatus.status === 'PENDING' && !verificationStatus.documents_complete && (
                <>
                  <strong className="text-orange-700">Documents manquants - Dépôt d'offres bloqué</strong>
                  <p className="text-sm text-orange-600">
                    Veuillez compléter votre dossier de vérification pour pouvoir créer des offres.
                  </p>
                </>
              )}
              {verificationStatus.status === 'PENDING' && verificationStatus.documents_complete && (
                <>
                  <strong className="text-blue-700">Vérification en cours</strong>
                  <p className="text-sm text-blue-600">
                    Votre dossier est en cours d'examen. Vous pourrez créer des offres une fois votre identité validée.
                  </p>
                </>
              )}
              {verificationStatus.status === 'REJECTED' && (
                <>
                  <strong className="text-red-700">Vérification refusée - Dépôt d'offres bloqué</strong>
                  <p className="text-sm text-red-600">
                    {verificationStatus.rejection_reason || 'Veuillez corriger votre dossier pour pouvoir créer des offres.'}
                  </p>
                </>
              )}
            </div>
            {verificationStatus.status !== 'PENDING' || !verificationStatus.documents_complete ? (
              <Button
                onClick={() => navigate('/carrier/verification')}
                className="rounded-full whitespace-nowrap"
                variant={verificationStatus.status === 'REJECTED' ? 'destructive' : 'default'}
              >
                <Shield className="w-4 h-4 mr-2" />
                {verificationStatus.status === 'NOT_STARTED' ? 'Vérifier mon identité' : 
                 verificationStatus.status === 'REJECTED' ? 'Corriger mon dossier' : 
                 'Compléter mon dossier'}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      )}

      {/* Badge de vérification si vérifié */}
      {isCarrier && verificationStatus?.status === 'VERIFIED' && (
        <Alert className="rounded-2xl border-green-200 bg-green-50">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <AlertDescription>
            <strong className="text-green-700">Identité vérifiée</strong>
            <span className="text-green-600 ml-2">
              Votre profil affiche le badge de confiance aux expéditeurs.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('common.hi')}, {user?.first_name} 👋
          </h1>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {getRoleLabel()}
            </Badge>
            {isCarrier && verificationStatus?.status === 'VERIFIED' && (
              <Badge className="bg-green-500 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Vérifié
              </Badge>
            )}
            {getRating() && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {getRating()} ({user.rating_count} {t('profile.reviews')})
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.primary ? 'default' : 'outline'}
              className={action.primary ? 'rounded-full shadow-lg' : 'rounded-full'}
              onClick={() => navigate(action.href)}
              data-testid={`quick-action-${index}`}
            >
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-primary/5 border-primary/20 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isShipper ? t('dashboard.myRequests') : t('dashboard.myOffers')}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {isShipper ? stats.requests.length : stats.offers.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {isShipper ? <Package className="w-6 h-6 text-primary" /> : <Truck className="w-6 h-6 text-primary" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.activeContracts')}</p>
                <p className="text-3xl font-bold mt-1">
                  {stats.contracts.filter(c => !['DELIVERED', 'CANCELLED'].includes(c.status)).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('messages.title')}</p>
                <p className="text-3xl font-bold mt-1">{stats.conversations.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.completedDeliveries')}</p>
                <p className="text-3xl font-bold mt-1">
                  {stats.contracts.filter(c => c.status === 'DELIVERED').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Items */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">
              {isShipper ? t('dashboard.myRequests') : t('dashboard.myOffers')}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={isShipper ? '/requests/mine' : '/offers/mine'}>
                {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isShipper ? stats.requests : stats.offers).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noActivity')}</p>
                <Button 
                  className="mt-4 rounded-full" 
                  onClick={() => navigate(isShipper ? '/requests/new' : '/offers/new')}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {isShipper ? t('requests.new') : t('offers.new')}
                </Button>
              </div>
            ) : (
              (isShipper ? stats.requests : stats.offers).slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/${isShipper ? 'requests' : 'offers'}/${item.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  data-testid={`recent-item-${item.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {item.mode === 'AIR' ? (
                        <span className="text-lg">✈️</span>
                      ) : (
                        <span className="text-lg">🚛</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {item.origin_city} → {item.destination_city}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isShipper ? `${item.weight} kg` : `${item.capacity_kg} kg`}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Contracts */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">{t('dashboard.myContracts')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/contracts">
                {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('contracts.noContracts')}</p>
                <p className="text-sm mt-1">{t('contracts.noContractsDesc')}</p>
              </div>
            ) : (
              stats.contracts.slice(0, 4).map((contract) => (
                <Link
                  key={contract.id}
                  to={`/contracts/${contract.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  data-testid={`recent-contract-${contract.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      contract.status === 'DELIVERED' ? 'bg-green-100' :
                      contract.status === 'CANCELLED' ? 'bg-red-100' :
                      'bg-primary/10'
                    }`}>
                      {contract.status === 'DELIVERED' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : contract.status === 'CANCELLED' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {contract.request?.origin_city} → {contract.request?.destination_city}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {contract.proposed_price}€
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(contract.status)}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      {stats.conversations.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">{t('messages.title')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/messages">
                {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.conversations.slice(0, 3).map((conv) => (
                <Link
                  key={conv.id}
                  to={`/messages/${conv.id}`}
                  className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  data-testid={`recent-message-${conv.id}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {conv.other_user?.first_name?.[0]}{conv.other_user?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {conv.other_user?.first_name} {conv.other_user?.last_name}
                      </p>
                    </div>
                  </div>
                  {conv.last_message && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {conv.last_message}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
