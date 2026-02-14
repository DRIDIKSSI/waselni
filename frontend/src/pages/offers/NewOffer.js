import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Truck, Loader2, CalendarIcon, Plane, ArrowLeft, ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import axios from 'axios';

const NewOffer = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { api, isCarrier } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    origin_country: '',
    origin_city: '',
    destination_country: '',
    destination_city: '',
    departure_date: null,
    arrival_date: null,
    capacity_kg: '',
    mode: '',
    price_per_kg: '',
    conditions: ''
  });

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ar': return ar;
      case 'en': return enUS;
      default: return fr;
    }
  };

  useEffect(() => {
    fetchCountries();
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const res = await api.get('/carriers/verification/status');
      setVerificationStatus(res.data);
    } catch (error) {
      console.error('Failed to check verification status:', error);
      setVerificationStatus({ status: 'NOT_STARTED', is_verified: false });
    } finally {
      setCheckingVerification(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.get(`${API_URL}/api/countries`);
      setCountries(res.data || []);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      setCountries([
        { id: '1', name: 'France', code: 'FR', is_origin: true, is_destination: true },
        { id: '2', name: 'Tunisie', code: 'TN', is_origin: true, is_destination: true }
      ]);
    }
  };

  const originCountries = countries.filter(c => c.is_origin);
  const destinationCountries = countries.filter(c => c.is_destination);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.departure_date || !formData.arrival_date) {
      toast.error(t('errors.required'));
      return;
    }

    if (formData.departure_date >= formData.arrival_date) {
      toast.error(t('errors.somethingWentWrong'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        capacity_kg: parseFloat(formData.capacity_kg),
        price_per_kg: parseFloat(formData.price_per_kg),
        departure_date: formData.departure_date.toISOString(),
        arrival_date: formData.arrival_date.toISOString()
      };

      const res = await api.post('/offers', payload);
      toast.success(t('success.created'));
      navigate(`/offers/${res.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  if (!isCarrier) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">{t('offers.accessDenied')}</h2>
        <p className="text-muted-foreground mb-4">
          {t('offers.accessDeniedDesc')}
        </p>
        <Button onClick={() => navigate('/requests')} className="rounded-full">
          {t('nav.browseRequests')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12" data-testid="new-offer-page">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('common.back')}
      </Button>

      <Card className="rounded-3xl shadow-lg">
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('offers.newTitle')}</CardTitle>
          <CardDescription className="text-base">
            {t('offers.newSubtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Mode de transport */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('requests.mode')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'TERRESTRIAL' })}
                  className={cn(
                    "p-6 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4",
                    formData.mode === 'TERRESTRIAL'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  )}
                  data-testid="mode-terrestrial"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    formData.mode === 'TERRESTRIAL' ? 'bg-primary text-white' : 'bg-muted'
                  )}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('requests.terrestrial')}</p>
                    <p className="text-sm text-muted-foreground">{t('requests.terrestrialDesc')}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'AIR' })}
                  className={cn(
                    "p-6 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4",
                    formData.mode === 'AIR'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  )}
                  data-testid="mode-air"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    formData.mode === 'AIR' ? 'bg-primary text-white' : 'bg-muted'
                  )}>
                    <Plane className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('requests.air')}</p>
                    <p className="text-sm text-muted-foreground">{t('requests.airDesc')}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Origine */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('requests.origin')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin_country">{t('requests.country')}</Label>
                  <Select 
                    value={formData.origin_country}
                    onValueChange={(v) => setFormData({ ...formData, origin_country: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl" data-testid="origin-country">
                      <SelectValue placeholder={t('common.search')} />
                    </SelectTrigger>
                    <SelectContent>
                      {originCountries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin_city">{t('requests.city')}</Label>
                  <Input
                    id="origin_city"
                    value={formData.origin_city}
                    onChange={(e) => setFormData({ ...formData, origin_city: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                    data-testid="origin-city"
                  />
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('requests.destination')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination_country">{t('requests.country')}</Label>
                  <Select 
                    value={formData.destination_country}
                    onValueChange={(v) => setFormData({ ...formData, destination_country: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl" data-testid="destination-country">
                      <SelectValue placeholder={t('common.search')} />
                    </SelectTrigger>
                    <SelectContent>
                      {destinationCountries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination_city">{t('requests.city')}</Label>
                  <Input
                    id="destination_city"
                    value={formData.destination_city}
                    onChange={(e) => setFormData({ ...formData, destination_city: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                    data-testid="destination-city"
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('offers.travelDates')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('offers.departureDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 rounded-xl justify-start text-left font-normal",
                          !formData.departure_date && "text-muted-foreground"
                        )}
                        data-testid="departure-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.departure_date ? (
                          format(formData.departure_date, "PPP", { locale: getDateLocale() })
                        ) : (
                          t('common.search')
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.departure_date}
                        onSelect={(date) => setFormData({ ...formData, departure_date: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>{t('offers.arrivalDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 rounded-xl justify-start text-left font-normal",
                          !formData.arrival_date && "text-muted-foreground"
                        )}
                        data-testid="arrival-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.arrival_date ? (
                          format(formData.arrival_date, "PPP", { locale: getDateLocale() })
                        ) : (
                          t('common.search')
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.arrival_date}
                        onSelect={(date) => setFormData({ ...formData, arrival_date: date })}
                        disabled={(date) => date < (formData.departure_date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Capacity & Price */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('offers.capacityAndPrice')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity_kg">{t('offers.capacity')}</Label>
                  <Input
                    id="capacity_kg"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.capacity_kg}
                    onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                    data-testid="capacity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_kg">{t('offers.pricePerKg')}</Label>
                  <Input
                    id="price_per_kg"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                    data-testid="price"
                  />
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <Label htmlFor="conditions" className="text-base font-semibold">{t('offers.conditions')}</Label>
              <Textarea
                id="conditions"
                placeholder={t('offers.conditionsPlaceholder')}
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                className="min-h-[100px] rounded-xl"
                data-testid="conditions"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-14 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
              data-testid="submit-offer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('offers.createOffer')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewOffer;
