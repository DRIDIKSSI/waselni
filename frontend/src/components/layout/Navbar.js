import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Package, 
  Truck, 
  MessageSquare, 
  FileText, 
  User, 
  LogOut, 
  Menu,
  Settings,
  Shield,
  Home,
  Search,
  PlusCircle
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { LanguageSelector } from '../LanguageSelector';

export const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated, isAdmin, isShipper, isCarrier } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'SHIPPER': return t('auth.shipper');
      case 'CARRIER_INDIVIDUAL': return t('auth.carrier');
      case 'CARRIER_PRO': return t('auth.carrierPro');
      case 'ADMIN': return t('admin.title');
      default: return '';
    }
  };

  const NavLinks = ({ mobile = false }) => (
    <>
      <Link
        to="/requests"
        onClick={() => mobile && setMobileOpen(false)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
          location.pathname.includes('/requests')
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Package className="w-4 h-4" />
        <span>{t('common.requests')}</span>
      </Link>
      <Link
        to="/offers"
        onClick={() => mobile && setMobileOpen(false)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
          location.pathname.includes('/offers')
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Truck className="w-4 h-4" />
        <span>{t('common.offers')}</span>
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
            <img 
              src="/waselni-logo.png" 
              alt="Waselni" 
              className="h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavLinks />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <LanguageSelector variant="ghost" />

            {isAuthenticated ? (
              <>
                {/* Quick Actions */}
                <div className="hidden md:flex items-center gap-2">
                  {isShipper && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => navigate('/requests/new')}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      {t('nav.sendPackage')}
                    </Button>
                  )}
                  {isCarrier && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => navigate('/offers/new')}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      {t('nav.transportPackages')}
                    </Button>
                  )}
                </div>

                {/* Messages */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex rounded-full"
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                        <AvatarImage src={user?.avatar_url ? `${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}` : undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center gap-3 p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar_url ? `${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}` : undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                      <Home className="w-4 h-4 mr-2" />
                      {t('common.dashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      {t('common.profile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/contracts')} className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      {t('common.contracts')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/messages')} className="cursor-pointer md:hidden">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t('common.messages')}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          {t('common.admin')}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  className="hidden sm:flex rounded-full"
                  onClick={() => navigate('/login')}
                >
                  {t('common.login')}
                </Button>
                <Button
                  className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate('/register')}
                >
                  {t('common.register')}
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-6 mt-8">
                  <NavLinks mobile />
                  
                  {isAuthenticated && (
                    <>
                      {isShipper && (
                        <Button
                          className="rounded-full"
                          onClick={() => {
                            navigate('/requests/new');
                            setMobileOpen(false);
                          }}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          {t('nav.sendPackage')}
                        </Button>
                      )}
                      {isCarrier && (
                        <Button
                          className="rounded-full"
                          onClick={() => {
                            navigate('/offers/new');
                            setMobileOpen(false);
                          }}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          {t('nav.transportPackages')}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
