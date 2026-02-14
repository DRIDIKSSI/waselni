import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
  Truck, 
  Filter, 
  MapPin, 
  Calendar, 
  Weight,
  Plane,
  Star,
  ChevronLeft,
  ChevronRight,
  Euro,
  Shield
} from 'lucide-react';

const OffersList = () => {
  const { t, i18n } = useTranslation();
  const { api } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({
    origin_country: searchParams.get('origin') || '',
    destination_country: searchParams.get('destination') || '',
    mode: ''
  });

  useEffect(() => {
    fetchOffers();
  }, [searchParams]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.origin_country && filters.origin_country !== 'all') {
        params.set('origin_country', filters.origin_country);
      }
      if (filters.destination_country && filters.destination_country !== 'all') {
        params.set('destination_country', filters.destination_country);
      }
      if (filters.mode && filters.mode !== 'all') {
        params.set('mode', filters.mode);
      }
      params.set('page', searchParams.get('page') || '1');

      const res = await api.get(`/offers?${params.toString()}`);
      setOffers(res.data.items || []);
      setPagination({
        total: res.data.total,
        page: res.data.page,
        pages: res.data.pages
      });
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (filters.origin_country) params.set('origin', filters.origin_country);
    if (filters.destination_country) params.set('destination', filters.destination_country);
    if (filters.mode) params.set('mode', filters.mode);
    params.set('page', '1');
    setSearchParams(params);
    fetchOffers();
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const getRating = (user) => {
    if (!user?.rating_count || user.rating_count === 0) return null;
    return (user.rating_sum / user.rating_count).toFixed(1);
  };

  const formatDate = (dateStr) => {
    const locale = i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'en' ? 'en-US' : 'fr-FR';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12" data-testid="offers-list-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {t('offers.title')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('offers.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl mb-8">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Select 
              value={filters.origin_country} 
              onValueChange={(v) => setFilters({ ...filters, origin_country: v })}
            >
              <SelectTrigger data-testid="filter-origin">
                <SelectValue placeholder={t('requests.origin')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Tunisie">Tunisie</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.destination_country} 
              onValueChange={(v) => setFilters({ ...filters, destination_country: v })}
            >
              <SelectTrigger data-testid="filter-destination">
                <SelectValue placeholder={t('requests.destination')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Tunisie">Tunisie</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.mode} 
              onValueChange={(v) => setFilters({ ...filters, mode: v })}
            >
              <SelectTrigger data-testid="filter-mode">
                <SelectValue placeholder={t('requests.mode')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('offers.filters.allModes')}</SelectItem>
                <SelectItem value="TERRESTRIAL">{t('requests.terrestrial')}</SelectItem>
                <SelectItem value="AIR">{t('requests.air')}</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleFilter} className="rounded-full" data-testid="filter-submit">
              <Filter className="w-4 h-4 mr-2" />
              {t('common.filters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">{t('common.noResults')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('errors.tryAgain')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Link
                key={offer.id}
                to={`/offers/${offer.id}`}
                className="group"
                data-testid={`offer-card-${offer.id}`}
              >
                <Card className="h-full rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          offer.mode === 'AIR' ? 'bg-blue-100' : 'bg-orange-100'
                        }`}>
                          {offer.mode === 'AIR' ? (
                            <Plane className="w-6 h-6 text-blue-600" />
                          ) : (
                            <Truck className="w-6 h-6 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {offer.mode === 'AIR' ? t('requests.air') : t('requests.terrestrial')}
                          </Badge>
                        </div>
                      </div>
                      {offer.user?.role === 'CARRIER_PRO' && (
                        <Badge className="bg-primary/10 text-primary border-0">
                          <Shield className="w-3 h-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                    </div>

                    {/* Route */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{offer.origin_city}, {offer.origin_country}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-2">
                        <div className="w-0.5 h-4 bg-border ml-1.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <span className="font-medium">{offer.destination_city}, {offer.destination_country}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <span className="text-xs">{formatDate(offer.departure_date)}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Weight className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <span className="text-xs">{offer.capacity_kg} kg</span>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-2 text-center">
                        <Euro className="w-4 h-4 mx-auto mb-1 text-primary" />
                        <span className="text-xs font-semibold text-primary">{offer.price_per_kg}€/kg</span>
                      </div>
                    </div>

                    {/* User */}
                    {offer.user && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {offer.user.first_name?.[0]}{offer.user.last_name?.[0]}
                          </div>
                          <span className="text-sm font-medium">
                            {offer.user.first_name} {offer.user.last_name?.[0]}.
                          </span>
                        </div>
                        {getRating(offer.user) && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {getRating(offer.user)}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OffersList;
