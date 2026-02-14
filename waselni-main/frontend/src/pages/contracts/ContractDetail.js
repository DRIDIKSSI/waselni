import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ArrowLeft, CheckCircle2, Clock, Truck, XCircle, Package, MessageSquare, Star, Phone, MapPin, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

const ContractDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [payment, setPayment] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchContract();
    
    // Handle PayPal return
    const paymentId = searchParams.get('paymentId');
    const payerId = searchParams.get('PayerID');
    if (paymentId && payerId) {
      executePayment(paymentId, payerId);
    }
  }, [id, searchParams]);

  const fetchContract = async () => {
    try {
      const res = await api.get(`/contracts/${id}`);
      setContract(res.data);
      
      // Fetch payment status
      try {
        const paymentRes = await api.get(`/payments/contract/${id}`);
        setPayment(paymentRes.data);
      } catch (e) {
        // No payment yet
      }
    } catch (error) {
      toast.error('Contrat non trouvé');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const executePayment = async (paymentId, payerId) => {
    setPaymentLoading(true);
    try {
      await api.post(`/payments/execute?payment_id=${paymentId}&payer_id=${payerId}`);
      toast.success('Paiement effectué avec succès !');
      // Clear URL params
      navigate(`/contracts/${id}`, { replace: true });
      fetchContract();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du paiement');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAction = async (action) => {
    setSubmitting(true);
    try {
      await api.post(`/contracts/${id}/${action}`);
      toast.success('Action effectuée !');
      fetchContract();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const returnUrl = `${window.location.origin}/contracts/${id}`;
      const cancelUrl = `${window.location.origin}/contracts/${id}`;
      
      const res = await api.post('/payments/create', {
        contract_id: id,
        return_url: returnUrl,
        cancel_url: cancelUrl
      });
      
      if (res.data.approval_url) {
        window.location.href = res.data.approval_url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création du paiement');
      setPaymentLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewComment.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/contracts/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      toast.success('Avis envoyé !');
      setReviewOpen(false);
      fetchContract();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setSubmitting(false);
    }
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

  if (!contract) return null;

  const isShipper = contract.shipper_id === user?.id;
  const isCarrier = contract.carrier_id === user?.id;
  const hasReviewed = contract.reviews?.some(r => r.reviewer_id === user?.id);
  const req = contract.request;
  const isPaid = payment?.status === 'completed' || contract.payment_status === 'paid';
  
  const getStepIndex = () => {
    if (contract.status === 'CANCELLED') return -1;
    if (contract.status === 'PROPOSED') return 0;
    if (contract.status === 'ACCEPTED') return 1;
    if (contract.status === 'PICKED_UP') return 2;
    if (contract.status === 'DELIVERED') return 3;
    return 0;
  };
  const currentStep = getStepIndex();

  const shipperAvatar = contract.shipper?.avatar_url ? `${backendUrl}${contract.shipper.avatar_url}` : undefined;
  const carrierAvatar = contract.carrier?.avatar_url ? `${backendUrl}${contract.carrier.avatar_url}` : undefined;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" data-testid="contract-detail-page">
      <Button variant="ghost" onClick={() => navigate('/contracts')} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />Retour
      </Button>

      {contract.status !== 'CANCELLED' && (
        <Card className="rounded-2xl mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center z-10", currentStep >= 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <Clock className="w-5 h-5" />
                </div>
                <span className={cn("text-sm mt-2", currentStep >= 0 ? "text-primary font-medium" : "text-muted-foreground")}>Proposé</span>
              </div>
              <div className={cn("h-1 flex-1", currentStep >= 1 ? "bg-primary" : "bg-muted")} />
              <div className="flex flex-col items-center flex-1">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center z-10", currentStep >= 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className={cn("text-sm mt-2", currentStep >= 1 ? "text-primary font-medium" : "text-muted-foreground")}>Accepté</span>
              </div>
              <div className={cn("h-1 flex-1", currentStep >= 2 ? "bg-primary" : "bg-muted")} />
              <div className="flex flex-col items-center flex-1">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center z-10", currentStep >= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <Truck className="w-5 h-5" />
                </div>
                <span className={cn("text-sm mt-2", currentStep >= 2 ? "text-primary font-medium" : "text-muted-foreground")}>En transit</span>
              </div>
              <div className={cn("h-1 flex-1", currentStep >= 3 ? "bg-primary" : "bg-muted")} />
              <div className="flex flex-col items-center flex-1">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center z-10", currentStep >= 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <Package className="w-5 h-5" />
                </div>
                <span className={cn("text-sm mt-2", currentStep >= 3 ? "text-primary font-medium" : "text-muted-foreground")}>Livré</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {contract.status === 'CANCELLED' && (
        <Card className="rounded-2xl mb-8 border-destructive/50 bg-destructive/5">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold text-destructive">Contrat annulé</h2>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Détails de l'envoi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold">{req?.origin_city}</p>
                    <p className="text-sm text-muted-foreground">{req?.origin_country}</p>
                  </div>
                </div>
                <div className="ml-2 w-0.5 h-4 bg-border" />
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold">{req?.destination_city}</p>
                    <p className="text-sm text-muted-foreground">{req?.destination_country}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-2xl font-bold">{req?.weight}</p>
                  <p className="text-xs text-muted-foreground">kg</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-lg font-semibold">{req?.package_type}</p>
                  <p className="text-xs text-muted-foreground">Type</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-4">
                  <p className="text-2xl font-bold text-primary">{contract.proposed_price}€</p>
                  <p className="text-xs text-muted-foreground">Prix</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Card */}
          {contract.status === 'ACCEPTED' && isShipper && !isPaid && (
            <Card className="rounded-2xl border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Paiement requis</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Effectuez le paiement via PayPal pour que le transporteur puisse prendre en charge votre colis.
                    </p>
                    {payment && payment.total_amount && (
                      <div className="bg-white rounded-lg p-3 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span>Prix du transport</span>
                          <span>{payment.base_price}€</span>
                        </div>
                        {payment.shipper_commission > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Frais de service</span>
                            <span>+{payment.shipper_commission}€</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                          <span>Total à payer</span>
                          <span>{payment.total_amount}€</span>
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={handlePayment} 
                      className="rounded-full bg-blue-600 hover:bg-blue-700"
                      disabled={paymentLoading}
                      data-testid="pay-with-paypal"
                    >
                      {paymentLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payer avec PayPal
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Success */}
          {isPaid && (
            <Card className="rounded-2xl border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-green-800">Paiement effectué</h3>
                    <p className="text-sm text-green-600">
                      Le paiement a été validé avec succès.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {contract.status !== 'CANCELLED' && contract.status !== 'DELIVERED' && (
            <Card className="rounded-2xl border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Actions</h3>
                <div className="flex flex-wrap gap-3">
                  {isShipper && contract.status === 'PROPOSED' && (
                    <Button onClick={() => handleAction('accept')} className="rounded-full" disabled={submitting} data-testid="accept-contract">
                      <CheckCircle2 className="w-4 h-4 mr-2" />Accepter
                    </Button>
                  )}
                  {isCarrier && contract.status === 'ACCEPTED' && (
                    <Button onClick={() => handleAction('pickup')} className="rounded-full" disabled={submitting} data-testid="pickup-contract">
                      <Truck className="w-4 h-4 mr-2" />Prise en charge
                    </Button>
                  )}
                  {isShipper && contract.status === 'PICKED_UP' && (
                    <Button onClick={() => handleAction('deliver')} className="rounded-full" disabled={submitting} data-testid="deliver-contract">
                      <Package className="w-4 h-4 mr-2" />Confirmer livraison
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => handleAction('cancel')} className="rounded-full text-destructive" disabled={submitting}>
                    <XCircle className="w-4 h-4 mr-2" />Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {contract.status === 'DELIVERED' && !hasReviewed && (
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full" data-testid="write-review">
                      <Star className="w-4 h-4 mr-2" />Laisser un avis
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Évaluation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Note</Label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setReviewRating(1)}><Star className={cn("w-8 h-8", reviewRating >= 1 ? "fill-yellow-400 text-yellow-400" : "text-muted")} /></button>
                          <button type="button" onClick={() => setReviewRating(2)}><Star className={cn("w-8 h-8", reviewRating >= 2 ? "fill-yellow-400 text-yellow-400" : "text-muted")} /></button>
                          <button type="button" onClick={() => setReviewRating(3)}><Star className={cn("w-8 h-8", reviewRating >= 3 ? "fill-yellow-400 text-yellow-400" : "text-muted")} /></button>
                          <button type="button" onClick={() => setReviewRating(4)}><Star className={cn("w-8 h-8", reviewRating >= 4 ? "fill-yellow-400 text-yellow-400" : "text-muted")} /></button>
                          <button type="button" onClick={() => setReviewRating(5)}><Star className={cn("w-8 h-8", reviewRating >= 5 ? "fill-yellow-400 text-yellow-400" : "text-muted")} /></button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Commentaire</Label>
                        <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="rounded-xl" data-testid="review-comment" />
                      </div>
                      <Button className="w-full rounded-full" onClick={handleReview} disabled={submitting} data-testid="submit-review">
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Envoyer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-lg">Expéditeur</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={shipperAvatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {contract.shipper?.first_name?.[0]}{contract.shipper?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{contract.shipper?.first_name} {contract.shipper?.last_name}</p>
                  {isCarrier && contract.shipper?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />{contract.shipper.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-lg">Transporteur</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={carrierAvatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {contract.carrier?.first_name?.[0]}{contract.carrier?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{contract.carrier?.first_name} {contract.carrier?.last_name}</p>
                  {isShipper && contract.carrier?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />{contract.carrier.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            variant="outline" 
            className="w-full rounded-full"
            onClick={() => {
              const otherUserId = isShipper ? contract.carrier_id : contract.shipper_id;
              api.post('/conversations', { request_id: contract.request_id, participant_id: otherUserId })
                .then(res => navigate(`/messages/${res.data.id}`));
            }}
          >
            <MessageSquare className="w-4 h-4 mr-2" />Message
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;
