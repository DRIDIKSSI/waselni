import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Package, Eye, EyeOff, Loader2, User, Truck, Building2, CheckCircle2 } from 'lucide-react';
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
  
  // États pour les checkboxes de rôle
  const [isShipper, setIsShipper] = useState(false);
  const [isCarrier, setIsCarrier] = useState(false);
  const [carrierType, setCarrierType] = useState('individual'); // 'individual' ou 'pro'

  // Calculer le rôle final basé sur les sélections
  const computeRole = () => {
    if (isShipper && isCarrier) {
      return 'SHIPPER_CARRIER';
    } else if (isShipper) {
      return 'SHIPPER';
    } else if (isCarrier) {
      return carrierType === 'pro' ? 'CARRIER_PRO' : 'CARRIER_INDIVIDUAL';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      const role = computeRole();
      if (!role) {
        toast.error(t('auth.selectAtLeastOneRole') || 'Veuillez sélectionner au moins un profil');
        return;
      }
      setFormData({ ...formData, role });
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

  // Obtenir le résumé des rôles sélectionnés
  const getRoleSummary = () => {
    const roles = [];
    if (isShipper) roles.push(t('auth.shipper') || 'Expéditeur');
    if (isCarrier) {
      roles.push(carrierType === 'pro' 
        ? (t('auth.carrierPro') || 'Transporteur Pro')
        : (t('auth.carrier') || 'Transporteur'));
    }
    return roles.join(' et ');
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
            {step === 1 ? (t('auth.selectRole') || 'Choisissez votre profil') : t('auth.registerSubtitle')}
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
              <div className="space-y-5">
                {/* Option Expéditeur */}
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    setIsShipper(!isShipper);
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    isShipper
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                  }`}
                  data-testid="role-shipper-option"
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="shipper-checkbox"
                      checked={isShipper}
                      onCheckedChange={() => {}}
                      className="mt-1 h-5 w-5 pointer-events-none"
                      data-testid="role-shipper-checkbox"
                    />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isShipper ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {t('auth.shipper') || 'Expéditeur'}
                        {isShipper && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('auth.shipperDesc') || 'Je veux envoyer des colis'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option Transporteur */}
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    setIsCarrier(!isCarrier);
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    isCarrier
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                  }`}
                  data-testid="role-carrier-option"
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="carrier-checkbox"
                      checked={isCarrier}
                      onCheckedChange={(checked) => setIsCarrier(checked)}
                      className="mt-1 h-5 w-5"
                      data-testid="role-carrier-checkbox"
                    />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isCarrier ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {t('auth.carrier') || 'Transporteur'}
                        {isCarrier && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('auth.carrierDesc') || 'Je veux transporter des colis'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Options de type de transporteur */}
                  {isCarrier && (
                    <div className="ml-16 mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        {t('auth.carrierTypeQuestion') || 'Type de transporteur :'}
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary/50">
                        <input
                          type="radio"
                          name="carrierType"
                          value="individual"
                          checked={carrierType === 'individual'}
                          onChange={() => setCarrierType('individual')}
                          className="w-4 h-4 text-primary"
                          data-testid="carrier-type-individual"
                        />
                        <Truck className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{t('auth.carrierIndividual') || 'Particulier'}</div>
                          <div className="text-xs text-muted-foreground">
                            {t('auth.carrierIndividualDesc') || 'Transport occasionnel'}
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary/50">
                        <input
                          type="radio"
                          name="carrierType"
                          value="pro"
                          checked={carrierType === 'pro'}
                          onChange={() => setCarrierType('pro')}
                          className="w-4 h-4 text-primary"
                          data-testid="carrier-type-pro"
                        />
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{t('auth.carrierPro') || 'Professionnel'}</div>
                          <div className="text-xs text-muted-foreground">
                            {t('auth.carrierProDesc') || 'Entreprise de transport (vérification requise)'}
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Résumé des sélections */}
                {(isShipper || isCarrier) && (
                  <div className="bg-primary/10 rounded-xl p-4 text-center animate-in fade-in duration-200">
                    <div className="text-sm text-muted-foreground">
                      {t('auth.selectedProfile') || 'Profil sélectionné :'}
                    </div>
                    <div className="font-semibold text-primary text-lg mt-1">
                      {getRoleSummary()}
                    </div>
                    {isShipper && isCarrier && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {t('auth.dualRoleInfo') || 'Vous pourrez envoyer ET transporter des colis'}
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                  disabled={!isShipper && !isCarrier}
                  data-testid="register-next"
                >
                  {t('common.next') || 'Suivant'}
                </Button>
              </div>
            ) : (
              <>
                {/* Afficher le rôle choisi */}
                <div className="bg-secondary/50 rounded-xl p-3 text-center mb-4">
                  <span className="text-sm text-muted-foreground">{t('auth.yourProfile') || 'Votre profil'} : </span>
                  <span className="font-semibold text-primary">{getRoleSummary()}</span>
                </div>

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
                    {t('common.back') || 'Retour'}
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
                      t('auth.registerButton') || "S'inscrire"
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
