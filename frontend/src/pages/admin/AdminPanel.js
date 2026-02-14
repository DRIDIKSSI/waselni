import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { 
  Users, 
  Package, 
  Truck, 
  FileText, 
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  Ban,
  RefreshCw,
  Globe,
  Plus,
  Trash2,
  Settings,
  DollarSign,
  CreditCard,
  BarChart3,
  TrendingUp,
  MapPin,
  Monitor,
  Megaphone,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

const AdminPanel = () => {
  const { api, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [carrierVerifications, setCarrierVerifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [settings, setSettings] = useState(null);
  const [payments, setPayments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [adsSettings, setAdsSettings] = useState(null);
  const [newCountry, setNewCountry] = useState({ name: '', code: '', is_origin: true, is_destination: true });
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, verificationsRes, carrierVerifRes, reportsRes, requestsRes, offersRes, countriesRes, settingsRes, paymentsRes, analyticsRes, adsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/verifications'),
        api.get('/admin/carrier-verifications'),
        api.get('/admin/reports'),
        api.get('/admin/requests'),
        api.get('/admin/offers'),
        api.get('/admin/countries'),
        api.get('/admin/settings'),
        api.get('/admin/payments'),
        api.get('/admin/analytics?days=30'),
        api.get('/admin/ads-settings')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.items || []);
      setVerifications(verificationsRes.data.items || []);
      setCarrierVerifications(carrierVerifRes.data.items || []);
      setReports(reportsRes.data.items || []);
      setRequests(requestsRes.data.items || []);
      setOffers(offersRes.data.items || []);
      setCountries(countriesRes.data || []);
      setSettings(settingsRes.data);
      setPayments(paymentsRes.data?.items || []);
      setAnalytics(analyticsRes.data);
      setAdsSettings(adsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId, suspend = true) => {
    try {
      await api.patch(`/admin/users/${userId}/${suspend ? 'suspend' : 'unsuspend'}`);
      toast.success(suspend ? 'Utilisateur suspendu' : 'Utilisateur réactivé');
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleVerification = async (verificationId, approve = true) => {
    try {
      await api.patch(`/admin/verifications/${verificationId}/${approve ? 'approve' : 'reject'}`);
      toast.success(approve ? 'Vérification approuvée' : 'Vérification rejetée');
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleCloseReport = async (reportId) => {
    try {
      await api.patch(`/admin/reports/${reportId}/close`);
      toast.success('Signalement clôturé');
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleHideItem = async (type, itemId) => {
    try {
      await api.delete(`/admin/${type}/${itemId}`);
      toast.success('Annonce masquée');
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddCountry = async (e) => {
    e.preventDefault();
    if (!newCountry.name || !newCountry.code) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      await api.post('/admin/countries', newCountry);
      toast.success('Pays ajouté');
      setNewCountry({ name: '', code: '', is_origin: true, is_destination: true });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const handleDeleteCountry = async (countryId) => {
    try {
      await api.delete(`/admin/countries/${countryId}`);
      toast.success('Pays supprimé');
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdateSettings = async (updates) => {
    setSavingSettings(true);
    try {
      const res = await api.patch('/admin/settings', updates);
      setSettings(res.data);
      toast.success('Paramètres mis à jour');
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateAdsSettings = async (updates) => {
    setSavingSettings(true);
    try {
      const res = await api.patch('/admin/ads-settings', updates);
      setAdsSettings(res.data);
      toast.success('Paramètres publicitaires mis à jour');
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSavingSettings(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      SHIPPER: 'Expéditeur',
      CARRIER_INDIVIDUAL: 'Transporteur',
      CARRIER_PRO: 'Transporteur Pro',
      ADMIN: 'Admin'
    };
    return labels[role] || role;
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12" data-testid="admin-panel">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
        Administration
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats?.users || 0}</p>
            <p className="text-xs text-muted-foreground">Utilisateurs</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats?.requests || 0}</p>
            <p className="text-xs text-muted-foreground">Demandes</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold">{stats?.offers || 0}</p>
            <p className="text-xs text-muted-foreground">Offres</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats?.contracts || 0}</p>
            <p className="text-xs text-muted-foreground">Contrats</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{stats?.pending_verifications || 0}</p>
            <p className="text-xs text-muted-foreground">Vérifications</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{stats?.open_reports || 0}</p>
            <p className="text-xs text-muted-foreground">Signalements</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{analytics?.today?.visits || 0}</p>
            <p className="text-xs text-muted-foreground">Visites (jour)</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{analytics?.total_visits || 0}</p>
            <p className="text-xs text-muted-foreground">Visites (total)</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="flex flex-wrap w-full rounded-xl h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="users" className="text-xs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="verifications" className="text-xs">Vérifications</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">Signalements</TabsTrigger>
          <TabsTrigger value="requests" className="text-xs">Demandes</TabsTrigger>
          <TabsTrigger value="offers" className="text-xs">Offres</TabsTrigger>
          <TabsTrigger value="countries" className="text-xs">Pays</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Paiements</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">📊 Analytics</TabsTrigger>
          <TabsTrigger value="ads" className="text-xs">📢 Publicités</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Paramètres</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Utilisateurs ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{u.first_name} {u.last_name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{getRoleLabel(u.role)}</Badge>
                      <Badge className={u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {u.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                      </Badge>
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspend(u.id, u.status === 'ACTIVE')}
                          className={u.status === 'ACTIVE' ? 'text-red-600' : 'text-green-600'}
                        >
                          {u.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verifications Tab */}
        <TabsContent value="verifications">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Vérifications Pro ({verifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {verifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune vérification en attente</p>
              ) : (
                <div className="space-y-3">
                  {verifications.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div>
                        <p className="font-semibold">{v.company_name || 'Non renseigné'}</p>
                        <p className="text-sm text-muted-foreground">
                          {v.user?.first_name} {v.user?.last_name} • {v.user?.email}
                        </p>
                        {v.siret && <p className="text-xs text-muted-foreground">SIRET: {v.siret}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          v.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                          v.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {v.status === 'VERIFIED' ? 'Vérifié' : v.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                        </Badge>
                        {v.status === 'PENDING' && (
                          <>
                            <Button size="sm" onClick={() => handleVerification(v.id, true)} className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleVerification(v.id, false)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Signalements ({reports.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun signalement</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{r.target_type}</Badge>
                          <span className="font-semibold">{r.reason}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Par {r.reporter?.first_name} {r.reporter?.last_name}
                        </p>
                        {r.details && <p className="text-sm text-muted-foreground mt-1">{r.details}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={r.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                          {r.status === 'OPEN' ? 'Ouvert' : 'Fermé'}
                        </Badge>
                        {r.status === 'OPEN' && (
                          <Button size="sm" variant="outline" onClick={() => handleCloseReport(r.id)}>
                            Clôturer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Demandes ({requests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {requests.slice(0, 20).map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div>
                      <p className="font-semibold">{req.origin_city} → {req.destination_city}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.user?.first_name} {req.user?.last_name} • {req.weight} kg
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{req.status}</Badge>
                      {!req.hidden && (
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleHideItem('requests', req.id)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Masquer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Offres ({offers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {offers.slice(0, 20).map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div>
                      <p className="font-semibold">{offer.origin_city} → {offer.destination_city}</p>
                      <p className="text-sm text-muted-foreground">
                        {offer.user?.first_name} {offer.user?.last_name} • {offer.capacity_kg} kg • {offer.price_per_kg}€/kg
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{offer.status}</Badge>
                      {!offer.hidden && (
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleHideItem('offers', offer.id)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Masquer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Countries Tab */}
        <TabsContent value="countries">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Gestion des pays ({countries.filter(c => c.active).length})
              </CardTitle>
              <CardDescription>
                Gérez les pays disponibles pour l'expédition et la réception de colis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Country Form */}
              <form onSubmit={handleAddCountry} className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-xl">
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="country-name">Nom du pays</Label>
                  <Input
                    id="country-name"
                    value={newCountry.name}
                    onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
                    placeholder="Ex: Algérie"
                    className="mt-1"
                    data-testid="new-country-name"
                  />
                </div>
                <div className="w-24">
                  <Label htmlFor="country-code">Code</Label>
                  <Input
                    id="country-code"
                    value={newCountry.code}
                    onChange={(e) => setNewCountry({ ...newCountry, code: e.target.value.toUpperCase() })}
                    placeholder="DZ"
                    maxLength={2}
                    className="mt-1"
                    data-testid="new-country-code"
                  />
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newCountry.is_origin}
                      onCheckedChange={(checked) => setNewCountry({ ...newCountry, is_origin: checked })}
                    />
                    <Label className="text-sm">Origine</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newCountry.is_destination}
                      onCheckedChange={(checked) => setNewCountry({ ...newCountry, is_destination: checked })}
                    />
                    <Label className="text-sm">Destination</Label>
                  </div>
                </div>
                <Button type="submit" className="self-end" data-testid="add-country-btn">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </form>

              {/* Countries List */}
              <div className="space-y-3">
                {countries.filter(c => c.active).map((country) => (
                  <div key={country.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {country.code}
                      </div>
                      <div>
                        <p className="font-semibold">{country.name}</p>
                        <div className="flex gap-2 mt-1">
                          {country.is_origin && (
                            <Badge variant="outline" className="text-xs">Origine</Badge>
                          )}
                          {country.is_destination && (
                            <Badge variant="outline" className="text-xs">Destination</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDeleteCountry(country.id)}
                      data-testid={`delete-country-${country.code}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {countries.filter(c => c.active).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucun pays configuré</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Historique des paiements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun paiement enregistré</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div>
                        <p className="font-semibold">{p.shipper?.first_name} → {p.carrier?.first_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Montant: {p.total_amount}€ • Payout transporteur: {p.carrier_payout}€
                        </p>
                        {p.commission_enabled && (
                          <p className="text-xs text-green-600">
                            Commission: {p.shipper_commission}€ + {p.carrier_commission}€ = {(p.shipper_commission + p.carrier_commission).toFixed(2)}€
                          </p>
                        )}
                      </div>
                      <Badge className={p.status === 'completed' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {p.status === 'completed' ? 'Complété' : p.status === 'pending' ? 'En attente' : 'Échoué'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-center">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-3xl font-bold">{analytics?.total_visits || 0}</p>
                  <p className="text-sm text-muted-foreground">Visites totales</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-3xl font-bold">{analytics?.total_unique_ips || 0}</p>
                  <p className="text-sm text-muted-foreground">IPs uniques</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-3xl font-bold">{analytics?.today?.visits || 0}</p>
                  <p className="text-sm text-muted-foreground">Visites aujourd'hui</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-center">
                  <Monitor className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-3xl font-bold">{analytics?.today?.unique_ips || 0}</p>
                  <p className="text-sm text-muted-foreground">IPs uniques (jour)</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Pages */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Pages les plus visitées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.top_pages?.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{page.page}</span>
                      <Badge variant="secondary">{page.count} visites</Badge>
                    </div>
                  ))}
                  {(!analytics?.top_pages || analytics.top_pages.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">Aucune donnée disponible</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* IP Statistics */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Statistiques par IP (Top 100)
                </CardTitle>
                <CardDescription>
                  Liste des adresses IP ayant visité le site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-semibold">Adresse IP</th>
                        <th className="text-center p-3 font-semibold">Visites</th>
                        <th className="text-right p-3 font-semibold">Dernière visite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.ip_stats?.map((ip, index) => (
                        <tr key={index} className="border-b border-muted/50 hover:bg-muted/30">
                          <td className="p-3 font-mono text-sm">{ip.ip}</td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary">{ip.visits}</Badge>
                          </td>
                          <td className="p-3 text-right text-sm text-muted-foreground">
                            {new Date(ip.last_visit).toLocaleString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!analytics?.ip_stats || analytics.ip_stats.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">Aucune donnée disponible</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Visits */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Visites récentes (50 dernières)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {analytics?.recent_visits?.map((visit, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{visit.ip}</p>
                        <p className="text-xs text-muted-foreground">{visit.page}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{new Date(visit.timestamp).toLocaleString('fr-FR')}</p>
                        <p className="text-xs text-muted-foreground">{visit.language}</p>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.recent_visits || analytics.recent_visits.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">Aucune visite récente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Google Ads Tab */}
        <TabsContent value="ads">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Configuration Google AdSense
              </CardTitle>
              <CardDescription>
                Configurez les publicités Google AdSense sur votre site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Ads */}
              <div className="p-6 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <Megaphone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Activer les publicités</h3>
                      <p className="text-sm text-muted-foreground">
                        Activez ou désactivez les publicités Google sur le site
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={adsSettings?.ads_enabled || false}
                    onCheckedChange={(checked) => handleUpdateAdsSettings({ ads_enabled: checked })}
                    disabled={savingSettings}
                    data-testid="ads-toggle"
                  />
                </div>
              </div>

              {/* Publisher ID */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="publisher-id" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    ID de l'éditeur (Publisher ID)
                  </Label>
                  <Input
                    id="publisher-id"
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    value={adsSettings?.publisher_id || ''}
                    onChange={(e) => setAdsSettings({ ...adsSettings, publisher_id: e.target.value })}
                    className="font-mono"
                    data-testid="publisher-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Trouvez votre ID éditeur dans votre compte Google AdSense → Compte → Informations sur le compte
                  </p>
                </div>

                <Button 
                  onClick={() => handleUpdateAdsSettings({ publisher_id: adsSettings?.publisher_id })}
                  disabled={savingSettings}
                  className="w-full sm:w-auto"
                >
                  Enregistrer l'ID éditeur
                </Button>
              </div>

              {/* Ad Slots */}
              {adsSettings?.ads_enabled && (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="font-semibold text-lg">Emplacements publicitaires (Ad Slots)</h3>
                  <p className="text-sm text-muted-foreground">
                    Entrez les ID des blocs d'annonces créés dans votre compte Google AdSense.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="header-slot">En-tête (Header)</Label>
                      <Input
                        id="header-slot"
                        placeholder="1234567890"
                        value={adsSettings?.header_ad_slot || ''}
                        onChange={(e) => setAdsSettings({ ...adsSettings, header_ad_slot: e.target.value })}
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sidebar-slot">Barre latérale (Sidebar)</Label>
                      <Input
                        id="sidebar-slot"
                        placeholder="1234567890"
                        value={adsSettings?.sidebar_ad_slot || ''}
                        onChange={(e) => setAdsSettings({ ...adsSettings, sidebar_ad_slot: e.target.value })}
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="footer-slot">Pied de page (Footer)</Label>
                      <Input
                        id="footer-slot"
                        placeholder="1234567890"
                        value={adsSettings?.footer_ad_slot || ''}
                        onChange={(e) => setAdsSettings({ ...adsSettings, footer_ad_slot: e.target.value })}
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="in-content-slot">Dans le contenu (In-Content)</Label>
                      <Input
                        id="in-content-slot"
                        placeholder="1234567890"
                        value={adsSettings?.in_content_ad_slot || ''}
                        onChange={(e) => setAdsSettings({ ...adsSettings, in_content_ad_slot: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleUpdateAdsSettings({
                      header_ad_slot: adsSettings?.header_ad_slot,
                      sidebar_ad_slot: adsSettings?.sidebar_ad_slot,
                      footer_ad_slot: adsSettings?.footer_ad_slot,
                      in_content_ad_slot: adsSettings?.in_content_ad_slot
                    })}
                    disabled={savingSettings}
                    className="w-full"
                  >
                    Enregistrer les emplacements
                  </Button>
                </div>
              )}

              {/* Instructions */}
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">📖 Instructions</h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li>Créez un compte Google AdSense sur <a href="https://www.google.com/adsense" target="_blank" rel="noopener noreferrer" className="underline">adsense.google.com</a></li>
                  <li>Ajoutez votre site et attendez l'approbation de Google</li>
                  <li>Une fois approuvé, récupérez votre ID éditeur (format: ca-pub-XXXXXXXXXXXXXXXX)</li>
                  <li>Créez des blocs d'annonces dans AdSense et récupérez leurs IDs</li>
                  <li>Entrez ces informations ci-dessus et activez les publicités</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Paramètres de la plateforme
              </CardTitle>
              <CardDescription>
                Configuration des commissions et autres paramètres
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Commission Settings */}
              <div className="p-6 bg-muted/50 rounded-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-lg">Commission sur les transactions</h3>
                      <p className="text-sm text-muted-foreground">
                        Prélevez une commission sur chaque transaction PayPal
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings?.commission_enabled || false}
                    onCheckedChange={(checked) => handleUpdateSettings({ commission_enabled: checked })}
                    disabled={savingSettings}
                    data-testid="commission-toggle"
                  />
                </div>

                {settings?.commission_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="shipper-rate">Commission expéditeur (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="shipper-rate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={(settings?.shipper_commission_rate || 0) * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) / 100;
                            handleUpdateSettings({ shipper_commission_rate: value });
                          }}
                          className="w-24"
                          disabled={savingSettings}
                          data-testid="shipper-rate-input"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajouté au montant payé par l'expéditeur
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carrier-rate">Commission transporteur (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="carrier-rate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={(settings?.carrier_commission_rate || 0) * 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) / 100;
                            handleUpdateSettings({ carrier_commission_rate: value });
                          }}
                          className="w-24"
                          disabled={savingSettings}
                          data-testid="carrier-rate-input"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Déduit du montant reçu par le transporteur
                      </p>
                    </div>
                  </div>
                )}

                {/* Commission Example */}
                {settings?.commission_enabled && (
                  <div className="p-4 bg-background rounded-lg border">
                    <h4 className="font-medium mb-2">Exemple de calcul</h4>
                    <p className="text-sm text-muted-foreground">
                      Pour un contrat de <strong>100€</strong>:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• L'expéditeur paie: <strong>{(100 * (1 + (settings?.shipper_commission_rate || 0))).toFixed(2)}€</strong></li>
                      <li>• Le transporteur reçoit: <strong>{(100 * (1 - (settings?.carrier_commission_rate || 0))).toFixed(2)}€</strong></li>
                      <li>• Commission totale: <strong>{(100 * ((settings?.shipper_commission_rate || 0) + (settings?.carrier_commission_rate || 0))).toFixed(2)}€</strong></li>
                    </ul>
                  </div>
                )}
              </div>

              {/* PayPal Status */}
              <div className="p-6 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">PayPal</h3>
                    <p className="text-sm text-muted-foreground">Mode Sandbox (Test)</p>
                  </div>
                  <Badge className="ml-auto bg-green-100 text-green-800">Connecté</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
