import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Package, 
  MapPin, 
  Calendar, 
  Weight,
  Plane,
  Truck,
  Star,
  ArrowLeft,
  MessageSquare,
  Zap,
  User,
  Flag,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user, isCarrier } = useAuth();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposing, setProposing] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data);
    } catch (error) {
      toast.error('Demande non trouvée');
      navigate('/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    try {
      const res = await api.post('/conversations', {
        request_id: id,
        participant_id: request.user_id
      });
      navigate(`/messages/${res.data.id}`);
    } catch (error) {
      toast.error('Erreur lors de la création de la conversation');
    }
  };

  const handleProposal = async () => {
    if (!proposalPrice || parseFloat(proposalPrice) <= 0) {
      toast.error('Veuillez entrer un prix valide');
      return;
    }

    setProposing(true);
    try {
      await api.post('/contracts', {
        request_id: id,
        carrier_id: user.id,
        proposed_price: parseFloat(proposalPrice)
      });
      toast.success('Proposition envoyée !');
      setProposalOpen(false);
      navigate('/contracts');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la proposition');
    } finally {
      setProposing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;
    
    try {
      await api.delete(`/requests/${id}`);
      toast.success('Demande supprimée');
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
      OPEN: { label: 'Ouverte', variant: 'default', color: 'bg-green-100 text-green-800' },
      IN_NEGOTIATION: { label: 'En négociation', variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      ACCEPTED: { label: 'Acceptée', variant: 'default', color: 'bg-blue-100 text-blue-800' },
      IN_TRANSIT: { label: 'En transit', variant: 'secondary', color: 'bg-purple-100 text-purple-800' },
      DELIVERED: { label: 'Livrée', variant: 'default', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Annulée', variant: 'destructive', color: 'bg-red-100 text-red-800' }
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

  if (!request) return null;

  const isOwner = user?.id === request.user_id;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" data-testid="request-detail-page">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl overflow-hidden">
            <div className={`h-2 ${request.mode === 'AIR' ? 'bg-blue-500' : 'bg-orange-500'}`} />
            <CardContent className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    request.mode === 'AIR' ? 'bg-blue-100' : 'bg-orange-100'
                  }`}>
                    {request.mode === 'AIR' ? (
                      <Plane className="w-8 h-8 text-blue-600" />
                    ) : (
                      <Truck className="w-8 h-8 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {request.origin_city} → {request.destination_city}
                    </h1>
                    <p className="text-muted-foreground">
                      {request.mode === 'AIR' ? 'Transport aérien' : 'Transport terrestre'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              {/* Route */}
              <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
                  <div>
                    <p className="font-semibold text-lg">{request.origin_city}</p>
                    <p className="text-muted-foreground">{request.origin_country}</p>
                  </div>
                </div>
                <div className="ml-1.5 w-0.5 h-8 bg-border" />
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
                  <div>
                    <p className="font-semibold text-lg">{request.destination_city}</p>
                    <p className="text-muted-foreground">{request.destination_country}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Weight className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{request.weight}</p>
                  <p className="text-xs text-muted-foreground">kg</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Package className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-semibold">{request.package_type}</p>
                  <p className="text-xs text-muted-foreground">Type</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-semibold">{formatDate(request.deadline)}</p>
                  <p className="text-xs text-muted-foreground">Date limite</p>
                </div>
                {request.width && (
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold">
                      {request.length}×{request.width}×{request.height}
                    </p>
                    <p className="text-xs text-muted-foreground">Dimensions (cm)</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{request.description}</p>
              </div>

              {/* Owner Actions */}
              {isOwner && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="rounded-full" onClick={() => navigate(`/requests/${id}/edit`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="outline" className="rounded-full text-destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                  <Button className="rounded-full ml-auto" onClick={() => navigate(`/matching/requests/${id}`)}>
                    <Zap className="w-4 h-4 mr-2" />
                    Voir les offres compatibles
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
              <CardTitle className="text-lg">Expéditeur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={request.user?.avatar_url ? `${process.env.REACT_APP_BACKEND_URL}${request.user.avatar_url}` : undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {request.user?.first_name?.[0]}{request.user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{request.user?.first_name} {request.user?.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.user?.city}, {request.user?.country}
                  </p>
                </div>
              </div>

              {getRating(request.user) && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{getRating(request.user)}</span>
                  <span className="text-muted-foreground">({request.user.rating_count} avis)</span>
                </div>
              )}

              <Link
                to={`/u/${request.user_id}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                Voir le profil complet
              </Link>
            </CardContent>
          </Card>

          {/* Actions for carriers */}
          {isCarrier && !isOwner && request.status === 'OPEN' && (
            <Card className="rounded-2xl border-primary/20 bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Intéressé par cette demande ?</h3>
                <p className="text-sm text-muted-foreground">
                  Contactez l'expéditeur ou faites une proposition directe.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full rounded-full" 
                    onClick={handleContact}
                    data-testid="contact-shipper"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contacter l'expéditeur
                  </Button>

                  <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full rounded-full"
                        data-testid="make-proposal"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Faire une proposition
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Proposer un prix</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Prix proposé (€)</Label>
                          <Input
                            id="price"
                            type="number"
                            min="1"
                            step="0.01"
                            value={proposalPrice}
                            onChange={(e) => setProposalPrice(e.target.value)}
                            placeholder="Ex: 50"
                            className="h-12 rounded-xl"
                            data-testid="proposal-price"
                          />
                        </div>
                        <Button 
                          className="w-full rounded-full" 
                          onClick={handleProposal}
                          disabled={proposing}
                          data-testid="submit-proposal"
                        >
                          {proposing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Envoi...
                            </>
                          ) : (
                            'Envoyer la proposition'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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

export default RequestDetail;
