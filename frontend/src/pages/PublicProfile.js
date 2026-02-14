import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Star, MapPin, Shield, MessageSquare } from 'lucide-react';

const PublicProfile = () => {
  const { id } = useParams();
  const { api, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    api.get(`/users/${id}`)
      .then(res => setProfile(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id, api]);

  const handleContact = () => {
    api.post('/conversations', { participant_id: id })
      .then(res => navigate(`/messages/${res.data.id}`))
      .catch(err => console.error(err));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold">Profil non trouvé</h2>
      </div>
    );
  }

  const avatarUrl = profile.avatar_url ? backendUrl + profile.avatar_url : undefined;
  const rating = profile.rating_count > 0 ? (profile.rating_sum / profile.rating_count).toFixed(1) : null;
  const initials = (profile.first_name?.[0] || '') + (profile.last_name?.[0] || '');
  const isPro = profile.role === 'CARRIER_PRO';
  const canContact = currentUser && currentUser.id !== id;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" data-testid="public-profile-page">
      <Card className="rounded-2xl mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h1>
                {isPro && <Badge className="bg-primary/10 text-primary border-0"><Shield className="w-3 h-3 mr-1" />Pro</Badge>}
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.city}, {profile.country}</span>
              </div>

              {rating && (
                <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{rating}</span>
                  <span className="text-muted-foreground">({profile.rating_count} avis)</span>
                </div>
              )}
            </div>

            {canContact && (
              <Button onClick={handleContact} className="rounded-full">
                <MessageSquare className="w-4 h-4 mr-2" />Contacter
              </Button>
            )}
          </div>

          {profile.bio && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">À propos</h3>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Avis reçus</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewList reviews={profile.reviews} />
        </CardContent>
      </Card>
    </div>
  );
};

function ReviewList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Aucun avis pour le moment</p>;
  }
  
  return (
    <div className="space-y-4">
      {reviews.map(function(review) {
        return <ReviewItem key={review.id} review={review} />;
      })}
    </div>
  );
}

function ReviewItem({ review }) {
  const r = review.rating;
  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <div className="flex items-center gap-1 mb-2">
        <Star className={r >= 1 ? "w-4 h-4 fill-yellow-400 text-yellow-400" : "w-4 h-4 text-muted"} />
        <Star className={r >= 2 ? "w-4 h-4 fill-yellow-400 text-yellow-400" : "w-4 h-4 text-muted"} />
        <Star className={r >= 3 ? "w-4 h-4 fill-yellow-400 text-yellow-400" : "w-4 h-4 text-muted"} />
        <Star className={r >= 4 ? "w-4 h-4 fill-yellow-400 text-yellow-400" : "w-4 h-4 text-muted"} />
        <Star className={r >= 5 ? "w-4 h-4 fill-yellow-400 text-yellow-400" : "w-4 h-4 text-muted"} />
      </div>
      <p className="text-sm">{review.comment}</p>
    </div>
  );
}

export default PublicProfile;
