import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie, Shield, Eye, Settings, BarChart3, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const CookiePolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-white" data-testid="cookie-policy-page">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary/80 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/">
            <Button variant="ghost" className="text-white/80 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Cookie className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Politique de Cookies</h1>
              <p className="text-white/80 mt-2">Dernière mise à jour : Février 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <Card className="rounded-2xl mb-8 border-none shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Chez <strong>Waselni</strong>, nous accordons une grande importance à la protection de votre vie privée. 
                Cette politique de cookies explique ce que sont les cookies, comment nous les utilisons, 
                les types de cookies que nous employons, les informations que nous collectons à l'aide des cookies 
                et comment ces informations sont utilisées, ainsi que la manière dont vous pouvez contrôler vos préférences en matière de cookies.
              </p>
            </CardContent>
          </Card>

          {/* What are cookies */}
          <Card className="rounded-2xl mb-8 border-none shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Cookie className="w-6 h-6 text-primary" />
                Qu'est-ce qu'un cookie ?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Les cookies sont de petits fichiers texte qui sont placés sur votre ordinateur ou appareil mobile 
                lorsque vous visitez un site web. Les cookies sont largement utilisés par les propriétaires de sites web 
                pour faire fonctionner leurs sites, ou pour les faire fonctionner plus efficacement, 
                ainsi que pour fournir des informations de reporting.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Les cookies définis par le propriétaire du site web (dans ce cas, Waselni) sont appelés 
                <strong> "cookies propriétaires"</strong>. Les cookies définis par des parties autres que le propriétaire 
                du site web sont appelés <strong>"cookies tiers"</strong>. Les cookies tiers permettent de fournir 
                des fonctionnalités ou des caractéristiques tierces sur ou via le site web (par exemple, la publicité, 
                le contenu interactif et l'analyse).
              </p>
            </CardContent>
          </Card>

          {/* Types of cookies */}
          <Card className="rounded-2xl mb-8 border-none shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Settings className="w-6 h-6 text-primary" />
                Types de cookies que nous utilisons
              </h2>
              
              <div className="space-y-6">
                {/* Necessary */}
                <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">Cookies strictement nécessaires</h3>
                  </div>
                  <p className="text-green-700 text-sm leading-relaxed">
                    Ces cookies sont essentiels pour vous permettre de naviguer sur le site web et d'utiliser ses fonctionnalités. 
                    Sans ces cookies, les services que vous avez demandés ne peuvent pas être fournis. 
                    Ces cookies ne collectent pas d'informations vous concernant qui pourraient être utilisées à des fins de marketing.
                  </p>
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Exemples :</strong> Cookies de session, authentification utilisateur, préférences de langue, 
                      consentement aux cookies.
                    </p>
                  </div>
                </div>

                {/* Analytics */}
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800">Cookies analytiques / de performance</h3>
                  </div>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Ces cookies nous permettent de compter les visites et les sources de trafic afin de mesurer et d'améliorer 
                    les performances de notre site. Ils nous aident à savoir quelles pages sont les plus et les moins populaires 
                    et à voir comment les visiteurs se déplacent sur le site.
                  </p>
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Exemples :</strong> Google Analytics, statistiques de pages vues, durée des sessions, 
                      taux de rebond.
                    </p>
                  </div>
                </div>

                {/* Marketing */}
                <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-800">Cookies de ciblage / publicitaires</h3>
                  </div>
                  <p className="text-purple-700 text-sm leading-relaxed">
                    Ces cookies sont utilisés pour afficher des publicités qui sont pertinentes pour vous. 
                    Ils sont également utilisés pour limiter le nombre de fois que vous voyez une publicité 
                    et pour aider à mesurer l'efficacité des campagnes publicitaires.
                  </p>
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Exemples :</strong> Google Ads, Facebook Pixel, publicités personnalisées, 
                      remarketing.
                    </p>
                  </div>
                </div>

                {/* Preferences */}
                <div className="p-6 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-orange-800">Cookies de fonctionnalité / préférences</h3>
                  </div>
                  <p className="text-orange-700 text-sm leading-relaxed">
                    Ces cookies permettent au site web de se souvenir des choix que vous faites (comme votre nom d'utilisateur, 
                    votre langue ou la région dans laquelle vous vous trouvez) et de fournir des fonctionnalités améliorées 
                    et plus personnalisées.
                  </p>
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Exemples :</strong> Préférences de thème (clair/sombre), langue préférée, 
                      paramètres de notifications.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to manage cookies */}
          <Card className="rounded-2xl mb-8 border-none shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Comment gérer vos cookies ?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Vous pouvez gérer vos préférences de cookies de plusieurs façons :
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <h4 className="font-semibold mb-2">1. Via notre bannière de consentement</h4>
                  <p className="text-sm text-muted-foreground">
                    Lors de votre première visite, vous pouvez accepter ou refuser les cookies via notre popup de consentement. 
                    Vous pouvez également personnaliser vos préférences à tout moment.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-xl">
                  <h4 className="font-semibold mb-2">2. Via les paramètres de votre navigateur</h4>
                  <p className="text-sm text-muted-foreground">
                    La plupart des navigateurs vous permettent de contrôler les cookies via leurs paramètres. 
                    Vous pouvez généralement trouver ces paramètres dans le menu "Options" ou "Préférences" de votre navigateur.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-xl">
                  <h4 className="font-semibold mb-2">3. Liens vers les paramètres des navigateurs populaires :</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                    <li>• <a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                    <li>• <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                    <li>• <a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data retention */}
          <Card className="rounded-2xl mb-8 border-none shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Conservation des données</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                La durée de conservation des cookies varie en fonction de leur type :
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Cookies de session :</strong> Supprimés à la fermeture du navigateur</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Cookies persistants :</strong> Restent sur votre appareil pendant une durée définie (généralement 1 à 24 mois)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Cookies de consentement :</strong> Conservés pendant 12 mois</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card className="rounded-2xl mb-8 border-none shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Mises à jour de cette politique</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous pouvons mettre à jour cette politique de cookies de temps à autre afin de refléter, 
                par exemple, des changements apportés aux cookies que nous utilisons ou pour d'autres raisons 
                opérationnelles, légales ou réglementaires. Veuillez donc consulter régulièrement cette politique 
                de cookies pour rester informé de notre utilisation des cookies et des technologies connexes.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                La date en haut de cette politique de cookies indique quand elle a été mise à jour pour la dernière fois.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Nous contacter</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Si vous avez des questions concernant notre utilisation des cookies ou cette politique, 
                veuillez nous contacter à :
              </p>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <strong>Email :</strong>{' '}
                  <a href="mailto:privacy@waselni.com" className="text-primary hover:underline">privacy@waselni.com</a>
                </p>
                <p className="text-muted-foreground">
                  <strong>Adresse :</strong> Paris, France / Tunis, Tunisie
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
