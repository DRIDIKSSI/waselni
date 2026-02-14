import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { X, Cookie, Settings, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

export const CookieConsent = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('waselni_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('waselni_cookie_consent', JSON.stringify(allConsent));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('waselni_cookie_consent', JSON.stringify(minimalConsent));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const customConsent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('waselni_cookie_consent', JSON.stringify(customConsent));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className={cn(
          "bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-500",
          showSettings ? "max-h-[90vh] overflow-y-auto" : ""
        )}
        data-testid="cookie-consent-popup"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Cookie className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('cookies.title')}</h2>
              <p className="text-white/80 text-sm">{t('cookies.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!showSettings ? (
            <>
              <p className="text-muted-foreground leading-relaxed">
                {t('cookies.description')}
              </p>
              
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  {t('cookies.rgpdNotice')}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('cookies.policyLink')}:{' '}
                <Link to="/cookie-policy" className="text-primary hover:underline font-medium">
                  {t('cookies.policyLink')}
                </Link>
              </p>
            </>
          ) : (
            <div className="space-y-4">
              {/* Necessary */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('cookies.necessary.title')}</h4>
                      <p className="text-xs text-muted-foreground">{t('cookies.necessary.description')}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {t('cookies.alwaysActive')}
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('cookies.analytics.title')}</h4>
                      <p className="text-xs text-muted-foreground">{t('cookies.analytics.description')}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Marketing */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('cookies.marketing.title')}</h4>
                      <p className="text-xs text-muted-foreground">{t('cookies.marketing.description')}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Preferences */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('cookies.preferences.title')}</h4>
                      <p className="text-xs text-muted-foreground">{t('cookies.preferences.description')}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.preferences}
                      onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          {!showSettings ? (
            <>
              <div className="flex gap-3">
                <Button 
                  onClick={handleAcceptAll}
                  className="flex-1 rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  data-testid="accept-all-cookies"
                >
                  {t('cookies.acceptAll')}
                </Button>
                <Button 
                  onClick={handleRejectAll}
                  variant="outline"
                  className="flex-1 rounded-full h-12 text-base font-semibold"
                  data-testid="reject-all-cookies"
                >
                  {t('cookies.rejectAll')}
                </Button>
              </div>
              <Button 
                onClick={() => setShowSettings(true)}
                variant="ghost"
                className="w-full rounded-full h-10 text-sm text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('cookies.customize')}
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={handleSavePreferences}
                className="w-full rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {t('cookies.savePreferences')}
              </Button>
              <Button 
                onClick={() => setShowSettings(false)}
                variant="ghost"
                className="w-full rounded-full h-10 text-sm text-muted-foreground hover:text-foreground"
              >
                ← {t('common.back')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
