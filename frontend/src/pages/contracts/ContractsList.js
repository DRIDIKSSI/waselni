import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  FileText,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  Truck
} from 'lucide-react';

const ContractsList = () => {
  const { t, i18n } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await api.get('/contracts');
      setContracts(res.data || []);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      PROPOSED: { 
        label: t('contracts.status.PROPOSED'), 
        icon: Clock, 
        color: 'bg-yellow-100 text-yellow-800',
        iconColor: 'text-yellow-600'
      },
      ACCEPTED: { 
        label: t('contracts.status.ACCEPTED'), 
        icon: CheckCircle2, 
        color: 'bg-blue-100 text-blue-800',
        iconColor: 'text-blue-600'
      },
      PICKED_UP: { 
        label: t('contracts.status.PICKED_UP'), 
        icon: Truck, 
        color: 'bg-purple-100 text-purple-800',
        iconColor: 'text-purple-600'
      },
      DELIVERED: { 
        label: t('contracts.status.DELIVERED'), 
        icon: CheckCircle2, 
        color: 'bg-green-100 text-green-800',
        iconColor: 'text-green-600'
      },
      CANCELLED: { 
        label: t('contracts.status.CANCELLED'), 
        icon: XCircle, 
        color: 'bg-red-100 text-red-800',
        iconColor: 'text-red-600'
      }
    };
    return configs[status] || { 
      label: status, 
      icon: AlertCircle, 
      color: 'bg-gray-100 text-gray-800',
      iconColor: 'text-gray-600'
    };
  };

  const formatDate = (dateStr) => {
    const locale = i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'en' ? 'en-US' : 'fr-FR';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isShipper = (contract) => contract.shipper_id === user.id;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const activeContracts = contracts.filter(c => !['DELIVERED', 'CANCELLED'].includes(c.status));
  const completedContracts = contracts.filter(c => ['DELIVERED', 'CANCELLED'].includes(c.status));

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" data-testid="contracts-list-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{t('contracts.title')}</h1>
        <p className="text-muted-foreground">{t('contracts.subtitle')}</p>
      </div>

      {contracts.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">{t('contracts.noContracts')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('contracts.noContractsDesc')}
            </p>
            <Button onClick={() => navigate('/requests')} className="rounded-full">
              {t('nav.browseRequests')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Contracts */}
          {activeContracts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('contracts.activeContracts')}</h2>
              <div className="space-y-4">
                {activeContracts.map((contract) => {
                  const statusConfig = getStatusConfig(contract.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <Link
                      key={contract.id}
                      to={`/contracts/${contract.id}`}
                      className="block"
                      data-testid={`contract-${contract.id}`}
                    >
                      <Card className="rounded-2xl hover:shadow-md hover:border-primary/20 transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-muted`}>
                              <StatusIcon className={`w-7 h-7 ${statusConfig.iconColor}`} />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">
                                  {contract.request?.origin_city} → {contract.request?.destination_city}
                                </h3>
                                <Badge className={statusConfig.color}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>
                                  {isShipper(contract) 
                                    ? `${t('auth.carrier')}: ${contract.carrier?.first_name} ${contract.carrier?.last_name}`
                                    : `${t('auth.shipper')}: ${contract.shipper?.first_name} ${contract.shipper?.last_name}`
                                  }
                                </span>
                                <span>•</span>
                                <span>{contract.proposed_price}€</span>
                                <span>•</span>
                                <span>{formatDate(contract.created_at)}</span>
                              </div>
                            </div>

                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Contracts */}
          {completedContracts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('contracts.history')}</h2>
              <div className="space-y-4">
                {completedContracts.map((contract) => {
                  const statusConfig = getStatusConfig(contract.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <Link
                      key={contract.id}
                      to={`/contracts/${contract.id}`}
                      className="block"
                      data-testid={`contract-${contract.id}`}
                    >
                      <Card className="rounded-2xl hover:shadow-md transition-all duration-300 opacity-75 hover:opacity-100">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-muted`}>
                              <StatusIcon className={`w-7 h-7 ${statusConfig.iconColor}`} />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">
                                  {contract.request?.origin_city} → {contract.request?.destination_city}
                                </h3>
                                <Badge className={statusConfig.color}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{contract.proposed_price}€</span>
                                <span>•</span>
                                <span>{formatDate(contract.created_at)}</span>
                              </div>
                            </div>

                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractsList;
