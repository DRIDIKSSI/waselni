import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { MessageSquare, Search, Package, Truck } from 'lucide-react';

const MessagesList = () => {
  const { t, i18n } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const locale = i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'en' ? 'en-US' : 'fr-FR';
    
    if (diff < 86400000) {
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 604800000) {
      return date.toLocaleDateString(locale, { weekday: 'short' });
    }
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  const filteredConversations = conversations.filter(conv => {
    if (!search) return true;
    const name = `${conv.other_user?.first_name} ${conv.other_user?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" data-testid="messages-list-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{t('messages.title')}</h1>
        <p className="text-muted-foreground">{t('messages.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={t('messages.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-12 rounded-xl"
          data-testid="search-conversations"
        />
      </div>

      {/* Conversations */}
      {filteredConversations.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {search ? t('common.noResults') : t('messages.noMessages')}
            </h3>
            <p className="text-muted-foreground">
              {search 
                ? t('errors.tryAgain') 
                : t('messages.noMessagesDesc')
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map((conv) => (
            <Link
              key={conv.id}
              to={`/messages/${conv.id}`}
              className="block"
              data-testid={`conversation-${conv.id}`}
            >
              <Card className="rounded-2xl hover:shadow-md hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={conv.other_user?.avatar_url ? `${process.env.REACT_APP_BACKEND_URL}${conv.other_user.avatar_url}` : undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {conv.other_user?.first_name?.[0]}{conv.other_user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">
                          {conv.other_user?.first_name} {conv.other_user?.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conv.last_message_at)}
                        </span>
                      </div>
                      
                      {conv.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message}
                        </p>
                      )}

                      {/* Context badge */}
                      <div className="flex items-center gap-2 mt-2">
                        {conv.request && (
                          <Badge variant="secondary" className="text-xs">
                            <Package className="w-3 h-3 mr-1" />
                            {conv.request.origin_city} → {conv.request.destination_city}
                          </Badge>
                        )}
                        {conv.offer && (
                          <Badge variant="secondary" className="text-xs">
                            <Truck className="w-3 h-3 mr-1" />
                            {conv.offer.origin_city} → {conv.offer.destination_city}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesList;
