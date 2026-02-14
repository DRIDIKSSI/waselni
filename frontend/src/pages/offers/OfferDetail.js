import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Weight,
  Plane,
  Star,
  ArrowLeft,
  MessageSquare,
  User,
  Flag,
  Edit,
  Trash2,
  Euro,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user, isShipper } = useAuth();
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    try {
      const res = await api.get(`/offers/${id}`);
      setOffer(res.data);
    } catch (error) {
      toast.error('Offre non trouvée');
      navigate('/offers');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    try {
      const res = await api.post('/conversations', {
        offer_id: id,
        participant_id: offer.user_id
      });
      navigate(`/messages/${res.data.id}`);
    } catch (error) {
      toast.error('Erreur lors de la création de la conversation');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return;
    
    try {
      await api.delete(`/offers/${id}`);
      toast.success('Offre supprimée');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getRating = (userData) => {
    if (!userData?.rating_count || userData.rating_count === 0) return null;
    return (userData.rating_sum / userData.rating_count).toFixed(1);
  };

  const getStatusBadge = (status) => {
    const config = {
      ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
      PAUSED: { label: 'En pause', color: 'bg-yellow-100 text-yellow-800' },
      EXPIRED: { label: 'Expirée', color: 'bg-red-100 text-red-800' }
    };
    const c = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!offer) return null;

  const isOwner = user?.id === offer.user_id;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" data-testid="offer-detail-page">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl overflow-hidden">
            <div className={`h-2 ${offer.mode === 'AIR' ? 'bg-blue-500' : 'bg-orange-500'}`} />
            <CardContent className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    offer.mode === 'AIR' ? 'bg-blue-100' : 'bg-orange-100'
                  }`}>
                    {offer.mode === 'AIR' ? (
                      <Plane className="w-8 h-8 text-blue-600" />
                    ) : (
                      <Truck className="w-8 h-8 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {offer.origin_city} → {offer.destination_city}
                    </h1>
                    <p className="text-muted-foreground">
                      {offer.mode === 'AIR' ? 'Transport aérien' : 'Transport terrestre'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {offer.user?.role === 'CARRIER_PRO' && (
                    <Badge className="bg-primary/10 text-primary border-0">
                      <Shield className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                  {getStatusBadge(offer.status)}
                </div>
              </div>

              {/* Route */}
              <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
                  <div>
                    <p className="font-semibold text-lg">{offer.origin_city}</p>
                    <p className="text-muted-foreground">{offer.origin_country}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Départ: {formatDate(offer.departure_date)}
                    </p>
                  </div>
                </div>
                <div className="ml-1.5 w-0.5 h-8 bg-border" />
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
                  <div>
                    <p className="font-semibold text-lg">{offer.destination_city}</p>
                    <p className="text-muted-foreground">{offer.destination_country}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Arrivée: {formatDate(offer.arrival_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Weight className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{offer.capacity_kg}</p>
                  <p className="text-xs text-muted-foreground">kg disponibles</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-4 text-center">
                  <Euro className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-primary">{offer.price_per_kg}€</p>
                  <p className="text-xs text-muted-foreground">par kg</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-semibold">{formatDate(offer.departure_date)}</p>
                  <p className="text-xs text-muted-foreground">Départ</p>
                </div>
              </div>

              {/* Conditions */}
              {offer.conditions && (
                <div>
                  <h3 className="font-semibold mb-2">Conditions</h3>
                  <p className="text-muted-foreground leading-relaxed">{offer.conditions}</p>
                </div>
              )}

              {/* Owner Actions */}
              {isOwner && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="rounded-full" onClick={() => navigate(`/offers/${id}/edit`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="outline" className="rounded-full text-destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                  <Button className="rounded-full ml-auto" onClick={() => navigate(`/matching/offers/${id}`)}>
                    <Zap className="w-4 h-4 mr-2" />
                    Voir les demandes compatibles
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Transporteur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={offer.user?.avatar_url ? `${process.env.REACT_APP_BACKEND_URL}${offer.user.avatar_url}` : undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {offer.user?.first_name?.[0]}{offer.user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{offer.user?.first_name} {offer.user?.last_name}</p>
                    {offer.user?.role === 'CARRIER_PRO' && (
                      <Shield className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {offer.user?.city}, {offer.user?.country}
                  </p>
                </div>
              </div>

              {getRating(offer.user) && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{getRating(offer.user)}</span>
                  <span className="text-muted-foreground">({offer.user.rating_count} avis)</span>
                </div>
              )}

              <Link
                to={`/u/${offer.user_id}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                Voir le profil complet
              </Link>
            </CardContent>
          </Card>

          {/* Actions for shippers */}
          {isShipper && !isOwner && offer.status === 'ACTIVE' && (
            <Card className="rounded-2xl border-primary/20 bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Intéressé par cette offre ?</h3>
                <p className="text-sm text-muted-foreground">
                  Contactez le transporteur pour discuter de votre envoi.
                </p>
                
                <Button 
                  className="w-full rounded-full" 
                  onClick={handleContact}
                  data-testid="contact-carrier"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contacter le transporteur
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Report */}
          {!isOwner && (
            <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
              <Flag className="w-4 h-4 mr-2" />
              Signaler cette annonce
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferDetail;
