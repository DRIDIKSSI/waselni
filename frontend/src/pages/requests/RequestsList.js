import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
  Package, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Weight,
  Plane,
  Truck,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const RequestsList = () => {
  const { t, i18n } = useTranslation();
  const { api } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({
    origin_country: searchParams.get('origin') || '',
    destination_country: searchParams.get('destination') || '',
    mode: '',
    status: 'OPEN'
  });

  useEffect(() => {
    fetchRequests();
  }, [searchParams]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.origin_country) params.set('origin_country', filters.origin_country);
      if (filters.destination_country) params.set('destination_country', filters.destination_country);
      if (filters.mode) params.set('mode', filters.mode);
      if (filters.status) params.set('status', filters.status);
      params.set('page', searchParams.get('page') || '1');

      const res = await api.get(`/requests?${params.toString()}`);
      setRequests(res.data.items || []);
      setPagination({
        total: res.data.total,
        page: res.data.page,
        pages: res.data.pages
      });
    } catch (error) {
      console.error('Failed to fetch requests:', error);
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
    fetchRequests();
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
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12" data-testid="requests-list-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {t('requests.title')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('requests.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl mb-8">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-5 gap-4">
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
                <SelectItem value="all">{t('requests.filters.allModes')}</SelectItem>
                <SelectItem value="TERRESTRIAL">{t('requests.terrestrial')}</SelectItem>
                <SelectItem value="AIR">{t('requests.air')}</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.status} 
              onValueChange={(v) => setFilters({ ...filters, status: v })}
            >
              <SelectTrigger data-testid="filter-status">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">{t('requests.status.OPEN')}</SelectItem>
                <SelectItem value="all">{t('common.all')}</SelectItem>
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
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">{t('common.noResults')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('errors.tryAgain')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Link
                key={request.id}
                to={`/requests/${request.id}`}
                className="group"
                data-testid={`request-card-${request.id}`}
              >
                <Card className="h-full rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          request.mode === 'AIR' ? 'bg-blue-100' : 'bg-orange-100'
                        }`}>
                          {request.mode === 'AIR' ? (
                            <Plane className="w-6 h-6 text-blue-600" />
                          ) : (
                            <Truck className="w-6 h-6 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {request.mode === 'AIR' ? t('requests.air') : t('requests.terrestrial')}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {request.package_type}
                      </Badge>
                    </div>

                    {/* Route */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{request.origin_city}, {request.origin_country}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-2">
                        <div className="w-0.5 h-4 bg-border ml-1.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <span className="font-medium">{request.destination_city}, {request.destination_country}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Weight className="w-4 h-4" />
                        {request.weight} kg
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(request.deadline)}
                      </div>
                    </div>

                    {/* User */}
                    {request.user && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {request.user.first_name?.[0]}{request.user.last_name?.[0]}
                          </div>
                          <span className="text-sm font-medium">
                            {request.user.first_name} {request.user.last_name?.[0]}.
                          </span>
                        </div>
                        {getRating(request.user) && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {getRating(request.user)}
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
                data-testid="pagination-prev"
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
                data-testid="pagination-next"
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

export default RequestsList;
