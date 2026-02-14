import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Package, 
  Truck, 
  Shield, 
  Star, 
  ArrowRight,
  Search,
  Plane,
  MapPin,
  Users,
  CheckCircle2,
  Zap
} from 'lucide-react';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('requests');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (destination) params.set('destination', destination);
    navigate(`/${searchType}?${params.toString()}`);
  };

  const features = [
    {
      icon: Shield,
      title: t('home.whyUs.secure.title'),
      description: t('home.whyUs.secure.description')
    },
    {
      icon: Zap,
      title: t('home.whyUs.fast.title'),
      description: t('home.whyUs.fast.description')
    },
    {
      icon: Star,
      title: t('home.whyUs.economical.title'),
      description: t('home.whyUs.economical.description')
    }
  ];

  const steps = [
    {
      icon: Package,
      title: t('home.howItWorks.step1.title'),
      description: t('home.howItWorks.step1.description')
    },
    {
      icon: Users,
      title: t('home.howItWorks.step2.title'),
      description: t('home.howItWorks.step2.description')
    },
    {
      icon: Truck,
      title: t('home.howItWorks.step3.title'),
      description: t('home.howItWorks.step3.description')
    }
  ];

  const stats = [
    { value: '10K+', label: t('home.stats.deliveries') },
    { value: '500+', label: t('home.stats.users') },
    { value: '4.8/5', label: t('home.stats.rating') },
    { value: '🇫🇷↔🇹🇳', label: t('home.stats.countries') }
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-[#003366] py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge variant="secondary" className="w-fit px-4 py-2 text-sm font-medium">
                🇫🇷 France ↔ 🇹🇳 Tunisie
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {t('home.hero.title')}
              </h1>
              
              <p className="text-lg text-white/80 leading-relaxed max-w-xl">
                {t('home.hero.subtitle')}
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="rounded-full text-lg px-8 h-14 bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300"
                  onClick={() => navigate('/register')}
                  data-testid="get-started-btn"
                >
                  {t('home.hero.cta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="rounded-full text-lg px-8 h-14 border-white/30 text-white hover:bg-white/10"
                  onClick={() => navigate('/offers')}
                >
                  {t('home.hero.seeOffers')}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Card */}
            <Card className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border-0">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6">{t('common.search')}</h3>
                
                <div className="space-y-4">
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="h-14 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requests">{t('nav.browseRequests')}</SelectItem>
                      <SelectItem value="offers">{t('nav.browseOffers')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                    <Input
                      placeholder={t('requests.origin')}
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="h-14 pl-12 rounded-xl"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />
                    <Input
                      placeholder={t('requests.destination')}
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="h-14 pl-12 rounded-xl"
                    />
                  </div>

                  <Button 
                    className="w-full h-14 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={handleSearch}
                    data-testid="search-btn"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    {t('common.search')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">{t('home.howItWorks.title')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">{t('home.howItWorks.title')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="rounded-3xl h-full border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">{t('home.whyUs.title')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">{t('home.whyUs.title')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="rounded-3xl border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-all duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-[#003366]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t('home.cta.title')}
          </h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
            {t('home.cta.subtitle')}
          </p>
          <Button 
            size="lg"
            className="rounded-full text-lg px-10 h-14 bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300"
            onClick={() => navigate('/register')}
          >
            {t('home.cta.button')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
