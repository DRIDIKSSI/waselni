import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Truck, Plane, MapPin, Calendar, Weight, Euro, Star, Shield, Zap } from 'lucide-react';

const MatchingRequestOffers = () => {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchMatches();
  }, [id]);

  const fetchMatches = async () => {
    try {
      const res = await api.get(`/matching/requests/${id}/offers`);
      setRequest(res.data.request);
      setOffers(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRating = (u) => {
    if (!u?.rating_count || u.rating_count === 0) return null;
    return (u.rating_sum / u.rating_count).toFixed(1);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12" data-testid="matching-offers-page">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>

      {request && (
        <Card className="rounded-2xl mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold">Offres compatibles pour votre demande</h1>
                <p className="text-muted-foreground">
                  {request.origin_city} → {request.destination_city} • {request.weight} kg • {request.mode === 'AIR' ? 'Avion' : 'Terrestre'}
                </p>
              </div>
              <Link to={`/requests/${id}`}>
                <Button variant="outline" className="rounded-full">Voir la demande</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {offers.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Aucune offre compatible</h3>
            <p className="text-muted-foreground mb-4">Il n'y a pas encore d'offres correspondant à votre demande.</p>
            <Button onClick={() => navigate('/offers')} className="rounded-full">Parcourir toutes les offres</Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-4">{offers.length} offre(s) trouvée(s)</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => {
              const isAir = offer.mode === 'AIR';
              const isPro = offer.user?.role === 'CARRIER_PRO';
              const userInitials = `${offer.user?.first_name?.[0] || ''}${offer.user?.last_name?.[0] || ''}`;
              const rating = getRating(offer.user);
              
              return (
                <Link key={offer.id} to={`/offers/${offer.id}`} className="group" data-testid={`matching-offer-${offer.id}`}>
                  <Card className="h-full rounded-2xl border-2 border-primary/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAir ? 'bg-blue-100' : 'bg-orange-100'}`}>
                          {isAir ? <Plane className="w-6 h-6 text-blue-600" /> : <Truck className="w-6 h-6 text-orange-600" />}
                        </div>
                        {isPro && (
                          <Badge className="bg-primary/10 text-primary border-0">
                            <Shield className="w-3 h-3 mr-1" />Pro
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{offer.origin_city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="font-medium">{offer.destination_city}</span>
                        </div>
                      </div>
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
                      {offer.user && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {userInitials}
                            </div>
                            <span className="text-sm font-medium">{offer.user.first_name}</span>
                          </div>
                          {rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {rating}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingRequestOffers;
