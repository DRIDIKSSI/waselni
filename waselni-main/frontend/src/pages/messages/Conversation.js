import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowLeft, Send, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

const MessageBubble = ({ msg, isOwn, backendUrl }) => {
  const avatarSrc = msg.sender?.avatar_url ? `${backendUrl}${msg.sender.avatar_url}` : undefined;
  const initials = `${msg.sender?.first_name?.[0] || ''}${msg.sender?.last_name?.[0] || ''}`;
  
  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "")} data-testid={`message-${msg.id}`}>
      {!isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={avatarSrc} />
          <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-3",
        isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
      )}>
        {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
        <span className={cn("text-xs mt-1 block", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {formatTime(msg.created_at)}
        </span>
      </div>
    </div>
  );
};

const Conversation = () => {
  const { id } = useParams();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchData = async () => {
    try {
      const convRes = await api.get(`/conversations/${id}`);
      const msgRes = await api.get(`/conversations/${id}/messages`);
      setConversation(convRes.data);
      setMessages(msgRes.data.items || []);
    } catch (error) {
      toast.error('Conversation non trouvée');
      navigate('/messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/conversations/${id}/messages`);
      setMessages(res.data.items || []);
    } catch (error) {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/conversations/${id}/messages`, { text: newMessage });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  if (!conversation) return null;

  const otherUser = conversation.other_user;
  const avatarUrl = otherUser?.avatar_url ? `${backendUrl}${otherUser.avatar_url}` : undefined;
  const initials = `${otherUser?.first_name?.[0] || ''}${otherUser?.last_name?.[0] || ''}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-80px)] flex flex-col" data-testid="conversation-page">
      <Card className="rounded-2xl mb-4 flex-shrink-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-12 h-12">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{otherUser?.first_name} {otherUser?.last_name}</p>
              <div className="flex items-center gap-2 mt-1">
                {conversation.request_id && (
                  <Link to={`/requests/${conversation.request_id}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <Package className="w-3 h-3" /> Voir la demande
                  </Link>
                )}
                {conversation.offer_id && (
                  <Link to={`/offers/${conversation.offer_id}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Voir l'offre
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === user.id} backendUrl={backendUrl} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <Card className="rounded-2xl flex-shrink-0">
        <CardContent className="p-4">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <Input
              placeholder="Écrivez votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 h-12 rounded-xl"
              disabled={sending}
              data-testid="message-input"
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl" disabled={!newMessage.trim() || sending} data-testid="send-message">
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Conversation;
