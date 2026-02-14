import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  User,
  MapPin,
  Calendar,
  Shield,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

const IdentityVerification = () => {
  const { t } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState(null);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    identity_doc_type: '',
    identity_first_name: '',
    identity_last_name: '',
    identity_birth_date: '',
    identity_doc_number: '',
    address_street: '',
    address_city: '',
    address_postal_code: '',
    address_country: ''
  });

  const [identityFile, setIdentityFile] = useState(null);
  const [addressFile, setAddressFile] = useState(null);
  const [addressDocDate, setAddressDocDate] = useState('');

  const docTypes = [
    { value: 'PASSPORT', label: 'Passeport' },
    { value: 'RESIDENCE_PERMIT', label: 'Titre de séjour' },
    { value: 'DRIVING_LICENSE', label: 'Permis de conduire' }
  ];

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const res = await api.get('/carriers/verification/status');
      setVerification(res.data);
      
      // Pré-remplir avec les données existantes
      if (res.data && res.data.status !== 'NOT_STARTED') {
        setFormData({
          identity_doc_type: res.data.identity_doc_type || '',
          identity_first_name: res.data.identity_first_name || '',
          identity_last_name: res.data.identity_last_name || '',
          identity_birth_date: res.data.identity_birth_date || '',
          identity_doc_number: res.data.identity_doc_number || '',
          address_street: res.data.address_street || '',
          address_city: res.data.address_city || '',
          address_postal_code: res.data.address_postal_code || '',
          address_country: res.data.address_country || ''
        });
        
        // Déterminer l'étape actuelle
        if (res.data.identity_doc_url && res.data.address_proof_url) {
          setStep(4); // Tout soumis
        } else if (res.data.identity_doc_url) {
          setStep(3); // Justificatif manquant
        } else if (res.data.identity_doc_type) {
          setStep(2); // Infos soumises, documents manquants
        }
      } else {
        // Pré-remplir avec les données utilisateur
        setFormData(prev => ({
          ...prev,
          identity_first_name: user?.first_name || '',
          identity_last_name: user?.last_name || '',
          address_city: user?.city || '',
          address_country: user?.country || ''
        }));
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/carriers/verification/submit', formData);
      toast.success('Informations enregistrées');
      setStep(2);
      await fetchVerificationStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadIdentity = async () => {
    if (!identityFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    setSubmitting(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', identityFile);

    try {
      await api.post('/carriers/verification/identity-document', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Pièce d\'identité uploadée');
      setStep(3);
      await fetchVerificationStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'upload');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadAddress = async () => {
    if (!addressFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }
    if (!addressDocDate) {
      toast.error('Veuillez indiquer la date du document');
      return;
    }

    setSubmitting(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', addressFile);

    try {
      await api.post(`/carriers/verification/address-proof?document_date=${addressDocDate}`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Justificatif de domicile uploadé');
      setStep(4);
      await fetchVerificationStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'upload');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Vérifié</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejeté</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> Non soumis</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si déjà vérifié
  if (verification?.status === 'VERIFIED') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Card className="rounded-2xl border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Identité Vérifiée</h2>
            <p className="text-green-600 mb-6">
              Votre identité a été vérifiée avec succès. Vous pouvez maintenant proposer vos services de transport en toute confiance.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="rounded-full">
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8" data-testid="identity-verification-page">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Vérification d'identité</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Pour assurer la sécurité de tous, nous devons vérifier votre identité avant que vous puissiez transporter des colis.
        </p>
        {verification && getStatusBadge(verification.status)}
      </div>

      {/* Message de rejet */}
      {verification?.status === 'REJECTED' && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Votre vérification a été rejetée.</strong><br />
            Motif : {verification.rejection_reason || 'Non spécifié'}<br />
            Veuillez corriger les informations et soumettre à nouveau.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
              step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {s}
            </div>
            {s < 4 && <div className={`w-8 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Informations personnelles */}
      {step === 1 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Renseignez vos informations telles qu'elles apparaissent sur votre pièce d'identité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitInfo} className="space-y-6">
              <div className="space-y-2">
                <Label>Type de pièce d'identité *</Label>
                <Select
                  value={formData.identity_doc_type}
                  onValueChange={(value) => setFormData({ ...formData, identity_doc_type: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl" data-testid="doc-type-select">
                    <SelectValue placeholder="Sélectionnez..." />
                  </SelectTrigger>
                  <SelectContent>
                    {docTypes.map((doc) => (
                      <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identity_first_name">Prénom (sur la pièce) *</Label>
                  <Input
                    id="identity_first_name"
                    value={formData.identity_first_name}
                    onChange={(e) => setFormData({ ...formData, identity_first_name: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identity_last_name">Nom (sur la pièce) *</Label>
                  <Input
                    id="identity_last_name"
                    value={formData.identity_last_name}
                    onChange={(e) => setFormData({ ...formData, identity_last_name: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identity_birth_date">Date de naissance *</Label>
                  <Input
                    id="identity_birth_date"
                    type="date"
                    value={formData.identity_birth_date}
                    onChange={(e) => setFormData({ ...formData, identity_birth_date: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identity_doc_number">Numéro du document *</Label>
                  <Input
                    id="identity_doc_number"
                    value={formData.identity_doc_number}
                    onChange={(e) => setFormData({ ...formData, identity_doc_number: e.target.value })}
                    required
                    placeholder="Ex: 12AB34567"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5" />
                  Adresse de domicile
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_street">Adresse complète *</Label>
                    <Input
                      id="address_street"
                      value={formData.address_street}
                      onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                      required
                      placeholder="Numéro et nom de rue"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_postal_code">Code postal *</Label>
                      <Input
                        id="address_postal_code"
                        value={formData.address_postal_code}
                        onChange={(e) => setFormData({ ...formData, address_postal_code: e.target.value })}
                        required
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_city">Ville *</Label>
                      <Input
                        id="address_city"
                        value={formData.address_city}
                        onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                        required
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pays *</Label>
                      <Select
                        value={formData.address_country}
                        onValueChange={(value) => setFormData({ ...formData, address_country: value })}
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Pays" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="Tunisie">Tunisie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-full text-lg"
                disabled={submitting || !formData.identity_doc_type}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Continuer
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload pièce d'identité */}
      {step === 2 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pièce d'identité
            </CardTitle>
            <CardDescription>
              Uploadez une photo ou scan lisible de votre {
                docTypes.find(d => d.value === formData.identity_doc_type)?.label.toLowerCase() || 'pièce d\'identité'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Conseils pour une bonne photo :</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Document entièrement visible, non coupé</li>
                  <li>Toutes les informations doivent être lisibles</li>
                  <li>Pas de reflet ni de flou</li>
                  <li>Formats acceptés : JPG, PNG, PDF</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed border-muted rounded-2xl p-8 text-center">
              <input
                type="file"
                id="identity-upload"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setIdentityFile(e.target.files[0])}
                className="hidden"
              />
              <label htmlFor="identity-upload" className="cursor-pointer">
                {identityFile ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-primary" />
                    <p className="font-medium">{identityFile.name}</p>
                    <p className="text-sm text-muted-foreground">Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="font-medium">Cliquez pour uploader</p>
                    <p className="text-sm text-muted-foreground">ou glissez-déposez votre fichier</p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-full">
                Retour
              </Button>
              <Button
                onClick={handleUploadIdentity}
                className="flex-1 h-12 rounded-full"
                disabled={submitting || !identityFile}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Continuer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Upload justificatif de domicile */}
      {step === 3 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Justificatif de domicile
            </CardTitle>
            <CardDescription>
              Uploadez une facture récente (électricité, gaz, eau, internet, téléphone) datée de moins de 3 mois
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Calendar className="w-4 h-4" />
              <AlertDescription>
                <strong>Documents acceptés :</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Facture d'électricité, gaz, eau</li>
                  <li>Facture internet ou téléphone fixe</li>
                  <li>Avis d'imposition</li>
                  <li><strong>Daté de moins de 3 mois</strong></li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="address_doc_date">Date du document *</Label>
              <Input
                id="address_doc_date"
                type="date"
                value={addressDocDate}
                onChange={(e) => setAddressDocDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="border-2 border-dashed border-muted rounded-2xl p-8 text-center">
              <input
                type="file"
                id="address-upload"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setAddressFile(e.target.files[0])}
                className="hidden"
              />
              <label htmlFor="address-upload" className="cursor-pointer">
                {addressFile ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-primary" />
                    <p className="font-medium">{addressFile.name}</p>
                    <p className="text-sm text-muted-foreground">Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="font-medium">Cliquez pour uploader</p>
                    <p className="text-sm text-muted-foreground">ou glissez-déposez votre fichier</p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-full">
                Retour
              </Button>
              <Button
                onClick={handleUploadAddress}
                className="flex-1 h-12 rounded-full"
                disabled={submitting || !addressFile || !addressDocDate}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Soumettre
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: En attente de validation */}
      {step === 4 && verification?.status === 'PENDING' && (
        <Card className="rounded-2xl border-blue-200 bg-blue-50">
          <CardContent className="p-8 text-center">
            <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Documents soumis</h2>
            <p className="text-blue-600 mb-6">
              Votre demande de vérification est en cours d'examen. Nous vous notifierons dès que la vérification sera terminée.
            </p>
            <div className="bg-white rounded-xl p-4 text-left space-y-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Informations personnelles</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Pièce d'identité uploadée</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Justificatif de domicile uploadé</span>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="rounded-full mt-6">
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IdentityVerification;
