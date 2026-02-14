import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Package, Loader2, CalendarIcon, Plane, Truck, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import axios from 'axios';

const NewRequest = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { api, isShipper } = useAuth();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    origin_country: '',
    origin_city: '',
    destination_country: '',
    destination_city: '',
    weight: '',
    width: '',
    height: '',
    length: '',
    package_type: '',
    mode: '',
    deadline: null,
    description: ''
  });

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ar': return ar;
      case 'en': return enUS;
      default: return fr;
    }
  };

  const packageTypes = [
    { key: 'clothes', label: t('requests.packageTypes.clothes') },
    { key: 'documents', label: t('requests.packageTypes.documents') },
    { key: 'electronics', label: t('requests.packageTypes.electronics') },
    { key: 'food', label: t('requests.packageTypes.food') },
    { key: 'cosmetics', label: t('requests.packageTypes.cosmetics') },
    { key: 'medicine', label: t('requests.packageTypes.medicine') },
    { key: 'gifts', label: t('requests.packageTypes.gifts') },
    { key: 'other', label: t('requests.packageTypes.other') }
  ];

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.get(`${API_URL}/api/countries`);
      setCountries(res.data || []);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      // Fallback to default countries
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
    
    if (!formData.deadline) {
      toast.error(t('errors.required'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        weight: parseFloat(formData.weight),
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        deadline: formData.deadline.toISOString()
      };

      const res = await api.post('/requests', payload);
      toast.success(t('success.created'));
      navigate(`/requests/${res.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  if (!isShipper) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">{t('requests.accessDenied')}</h2>
        <p className="text-muted-foreground mb-4">
          {t('requests.accessDeniedDesc')}
        </p>
        <Button onClick={() => navigate('/offers')} className="rounded-full">
          {t('nav.browseOffers')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12" data-testid="new-request-page">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('common.back')}
      </Button>

      <Card className="rounded-3xl shadow-lg">
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('requests.newTitle')}</CardTitle>
          <CardDescription className="text-base">
            {t('requests.newSubtitle')}
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

            {/* Colis details */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('requests.packageDetails')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="package_type">{t('requests.packageType')}</Label>
                  <Select 
                    value={formData.package_type}
                    onValueChange={(v) => setFormData({ ...formData, package_type: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl" data-testid="package-type">
                      <SelectValue placeholder={t('common.search')} />
                    </SelectTrigger>
                    <SelectContent>
                      {packageTypes.map((type) => (
                        <SelectItem key={type.key} value={type.label}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">{t('requests.weight')}</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                    data-testid="weight"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">{t('requests.length')}</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="h-12 rounded-xl"
                    data-testid="length"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">{t('requests.width')}</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="h-12 rounded-xl"
                    data-testid="width"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">{t('requests.height')}</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="h-12 rounded-xl"
                    data-testid="height"
                  />
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">{t('requests.deadline')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 rounded-xl justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground"
                    )}
                    data-testid="deadline-picker"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? (
                      format(formData.deadline, "PPP", { locale: getDateLocale() })
                    ) : (
                      t('common.search')
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => setFormData({ ...formData, deadline: date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">{t('requests.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('requests.descriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="min-h-[120px] rounded-xl"
                data-testid="description"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-14 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
              data-testid="submit-request"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('requests.createRequest')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewRequest;
