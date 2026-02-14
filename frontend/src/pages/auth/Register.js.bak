import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Package, Eye, EyeOff, Loader2, User, Truck, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    first_name: '',
    last_name: '',
    phone: '',
    country: '',
    city: ''
  });

  const roles = [
    { value: 'SHIPPER', label: t('auth.shipper'), icon: User, description: t('auth.shipperDesc') },
    { value: 'CARRIER_INDIVIDUAL', label: t('auth.carrier'), icon: Truck, description: t('auth.carrierDesc') },
    { value: 'CARRIER_PRO', label: t('auth.carrierPro'), icon: Building2, description: t('auth.carrierProDesc') }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.role) {
        toast.error(t('errors.required'));
        return;
      }
      setStep(2);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('errors.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('errors.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      toast.success(t('success.created'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-gradient-to-b from-secondary/30 to-white" data-testid="register-page">
      <Card className="w-full max-w-lg shadow-2xl rounded-3xl border-0">
        <CardHeader className="space-y-4 text-center pb-6">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          </Link>
          <CardTitle className="text-2xl font-bold">{t('auth.registerTitle')}</CardTitle>
          <CardDescription className="text-base">
            {step === 1 ? t('auth.selectRole') : t('auth.registerSubtitle')}
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-12 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.value })}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 flex items-start gap-4 ${
                      formData.role === role.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                    }`}
                    data-testid={`role-${role.value.toLowerCase()}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      formData.role === role.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <role.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{role.label}</div>
                      <div className="text-sm text-muted-foreground">{role.description}</div>
                    </div>
                  </button>
                ))}

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                  data-testid="register-next"
                >
                  {t('common.next')}
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t('auth.firstName')}</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                      className="h-12 rounded-xl"
                      data-testid="register-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t('auth.lastName')}</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                      className="h-12 rounded-xl"
                      data-testid="register-lastname"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                    data-testid="register-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('auth.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+33 ou +216"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                    data-testid="register-phone"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('profile.country')}</Label>
                    <Select 
                      value={formData.country} 
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger className="h-12 rounded-xl" data-testid="register-country">
                        <SelectValue placeholder={t('common.search')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Tunisie">Tunisie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('profile.city')}</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      className="h-12 rounded-xl"
                      data-testid="register-city"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-12 rounded-xl pr-12"
                      data-testid="register-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                    data-testid="register-confirm-password"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1 h-12 rounded-full"
                    onClick={() => setStep(1)}
                  >
                    {t('common.back')}
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                    data-testid="register-submit"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('auth.registerButton')
                    )}
                  </Button>
                </div>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary font-medium hover:underline" data-testid="login-link">
                {t('auth.loginButton')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
