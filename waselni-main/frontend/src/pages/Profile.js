import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  User, 
  Camera, 
  Save, 
  Loader2,
  Star,
  MapPin,
  Phone,
  Mail,
  Shield,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { t } = useTranslation();
  const { user, api, updateUser, isCarrierPro } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    country: '',
    city: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        country: user.country || '',
        city: user.city || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.patch('/users/me', formData);
      updateUser(res.data);
      toast.success(t('profile.updateSuccess'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ avatar_url: res.data.avatar_url });
      toast.success(t('success.updated'));
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setUploading(false);
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'SHIPPER': return t('auth.shipper');
      case 'CARRIER_INDIVIDUAL': return t('auth.carrier');
      case 'CARRIER_PRO': return t('auth.carrierPro');
      case 'ADMIN': return t('admin.title');
      default: return '';
    }
  };

  const getRating = () => {
    if (!user?.rating_count || user.rating_count === 0) return null;
    return (user.rating_sum / user.rating_count).toFixed(1);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" data-testid="profile-page">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">{t('profile.title')}</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Avatar Card */}
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <Avatar className="w-32 h-32 border-4 border-primary/20">
                  <AvatarImage src={user?.avatar_url ? `${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}` : undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <h2 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h2>
              <Badge variant="secondary" className="mt-2">{getRoleLabel()}</Badge>

              {getRating() && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{getRating()}</span>
                  <span className="text-muted-foreground">({user.rating_count} {t('profile.reviews')})</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{user?.phone || t('common.noResults')}</span>
                {user?.phone_verified && (
                  <Badge variant="outline" className="text-xs">{t('profile.verified')}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{user?.city}, {user?.country}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pro Verification */}
          {isCarrierPro && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {t('profile.proVerification')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full rounded-full"
                  onClick={() => navigate('/profile/verification')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t('profile.submitVerification')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{t('profile.personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t('auth.firstName')}</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="h-12 rounded-xl"
                      data-testid="profile-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t('auth.lastName')}</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="h-12 rounded-xl"
                      data-testid="profile-lastname"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('auth.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-12 rounded-xl"
                    data-testid="profile-phone"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('profile.country')}</Label>
                    <Select 
                      value={formData.country}
                      onValueChange={(v) => setFormData({ ...formData, country: v })}
                    >
                      <SelectTrigger className="h-12 rounded-xl" data-testid="profile-country">
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
                      className="h-12 rounded-xl"
                      data-testid="profile-city"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('profile.bio')}</Label>
                  <Textarea
                    id="bio"
                    placeholder={t('profile.bioPlaceholder')}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="min-h-[120px] rounded-xl"
                    data-testid="profile-bio"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-full text-lg font-semibold"
                  disabled={loading}
                  data-testid="profile-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {t('common.save')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
