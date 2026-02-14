# Waselni - Plateforme de Mise en Relation France ⇄ Tunisie

## Vue d'ensemble
Plateforme de mise en relation entre expéditeurs et transporteurs pour l'envoi de colis entre la France et la Tunisie. Deux modes de transport: terrestre et aérien.

## Date de création
Janvier 2026

## Dernière mise à jour
Décembre 2025 - Traduction complète du site en 3 langues (FR/EN/AR)

## Stack Technique
- **Backend**: FastAPI (Python) + MongoDB
- **Frontend**: React + TailwindCSS + i18next (multi-langue)
- **Authentification**: JWT (access + refresh tokens)
- **Paiement**: PayPal (Sandbox configuré)
- **UI Languages**: Français, English, العربية (avec support RTL)

## Rôles Utilisateurs
1. **SHIPPER** (Expéditeur) - Crée des demandes d'envoi de colis
2. **CARRIER_INDIVIDUAL** (Transporteur particulier) - Propose des offres de transport occasionnelles
3. **CARRIER_PRO** (Transporteur professionnel) - Professionnel vérifié avec documents
4. **ADMIN** - Administration de la plateforme

## Fonctionnalités Implémentées ✅

### Authentification
- [x] Inscription avec sélection de rôle (2 étapes)
- [x] Connexion JWT avec access/refresh tokens
- [x] Déconnexion
- [x] Réinitialisation de mot de passe (simulé)
- [x] Vérification téléphone OTP (simulé avec code 123456)

### Gestion des Profils
- [x] Profil utilisateur éditable (nom, téléphone, pays, ville, bio)
- [x] Upload de photo de profil
- [x] Profil public avec avis et notation
- [x] Vérification transporteur pro (documents)

### Demandes d'envoi (SHIPPER)
- [x] CRUD complet
- [x] Sélection origine/destination (pays + ville) - **Pays dynamiques depuis l'admin**
- [x] Mode de transport (terrestre/aérien)
- [x] Détails: poids, dimensions, type de colis
- [x] Date limite de livraison
- [x] Upload de photos de colis
- [x] Filtres et pagination

### Offres de transport (CARRIERS)
- [x] CRUD complet
- [x] Trajet origine/destination - **Pays dynamiques depuis l'admin**
- [x] Dates de départ/arrivée
- [x] Capacité en kg
- [x] Prix par kg
- [x] Conditions de transport
- [x] Filtres et pagination

### Matching
- [x] Offres compatibles pour une demande
- [x] Demandes compatibles pour une offre
- [x] Filtrage automatique par route, mode, poids

### Messagerie Interne
- [x] Conversations liées aux demandes/offres
- [x] Messages texte
- [x] Upload de pièces jointes
- [x] Polling temps réel (5 secondes)
- [x] Liste des conversations avec dernier message

### Contrats / Missions
- [x] Création de proposition (PROPOSED)
- [x] Workflow complet: PROPOSED → ACCEPTED → PICKED_UP → DELIVERED
- [x] Annulation possible
- [x] Timeline des statuts
- [x] Informations de contact (téléphone) entre parties
- [x] **Paiement PayPal intégré** avec calcul de commission

### Avis & Notation
- [x] Évaluation après livraison (1-5 étoiles + commentaire)
- [x] Un seul avis par contrat par partie
- [x] Moyenne affichée sur profil

### Paiements & Commissions (NOUVEAU ✅)
- [x] Intégration PayPal (mode Sandbox)
- [x] Commission configurable (% expéditeur + % transporteur)
- [x] Toggle activation/désactivation de la commission
- [x] Calcul automatique du montant total et du payout transporteur
- [x] Historique des paiements dans l'admin

### Admin Panel
- [x] Statistiques globales
- [x] Liste utilisateurs avec suspension/réactivation
- [x] Vérification transporteurs pro (approuver/rejeter)
- [x] Modération des annonces (masquer)
- [x] Liste des signalements
- [x] **Gestion des pays** (ajouter/supprimer des pays pour origine/destination)
- [x] **Paramètres de commission** (activer/désactiver, configurer les %)
- [x] **Analytics visiteurs** (compteur, IPs, pages visitées)
- [x] **Configuration Google AdSense** (publicités)

### Analytics & Tracking (NOUVEAU ✅)
- [x] Tracking automatique des visiteurs
- [x] Compteur de visites total et journalier
- [x] Statistiques par IP
- [x] Pages les plus visitées
- [x] Historique des visites récentes

### Publicités Google (NOUVEAU ✅)
- [x] Configuration Google AdSense depuis l'admin
- [x] Toggle activation/désactivation
- [x] Gestion des emplacements (Header, Sidebar, Footer, In-Content)
- [x] Instructions d'intégration incluses

### RGPD & Cookies (NOUVEAU ✅)
- [x] Popup de consentement aux cookies
- [x] Options: Accepter tout / Refuser tout / Personnaliser
- [x] Page Politique de Cookies complète
- [x] Sauvegarde des préférences en localStorage

### Multi-langue (COMPLET ✅)
- [x] Support de 3 langues : Français, English, العربية
- [x] Sélecteur de langue dans la navbar avec drapeaux
- [x] Support RTL automatique pour l'arabe (persistant)
- [x] Traductions complètes de TOUTES les pages:
  - [x] Home, Login, Register, Dashboard, Profile
  - [x] NewRequest, RequestsList, NewOffer, OffersList
  - [x] ContractsList, MessagesList
  - [x] Navbar, Footer, CookieConsent, CookiePolicy
  - [x] Admin Panel (tous les onglets)
- [x] Fichiers de traduction: fr.json, en.json, ar.json (~625 clés chacun)
- [x] Détection automatique de la langue du navigateur
- [x] Persistance du choix de langue en localStorage
- [x] Direction RTL/LTR persistante au rechargement de page

### Signalements
- [x] Signaler utilisateur/annonce/message
- [x] Raison et détails
- [x] Clôture par admin

## Comptes de Test
- **Admin**: admin@logimatch.com / admin123
- **Expéditeur**: marie@example.com / password123
- **Expéditeur**: ahmed@example.com / password123
- **Transporteur Pro**: transport.pro@example.com / password123
- **Transporteur**: salim@example.com / password123

## API Endpoints
Tous les endpoints sont préfixés par `/api`:
- Auth: register, login, refresh, logout, reset-password, verify-phone
- Users: me, avatar, verification (pro)
- Requests: CRUD + photos + mine
- Offers: CRUD + mine
- Matching: requests/:id/offers, offers/:id/requests
- Conversations: CRUD + messages
- Contracts: CRUD + accept/pickup/deliver/cancel + reviews
- Payments: create, execute, contract/:id (NOUVEAU)
- Reports: création + admin gestion
- Admin: users, verifications, reports, listings, stats, countries, settings, analytics, ads-settings (NOUVEAU)
- Countries: liste publique des pays autorisés (NOUVEAU)
- Analytics: track (NOUVEAU)
- Ads-config: configuration publique des pubs (NOUVEAU)

## Fichiers Créés/Modifiés
- `/app/backend/server.py` - Backend principal avec tous les endpoints
- `/app/frontend/src/i18n/index.js` - Configuration i18next avec RTL
- `/app/frontend/src/i18n/locales/fr.json` - Traductions françaises (~625 clés)
- `/app/frontend/src/i18n/locales/en.json` - Traductions anglaises (~625 clés)
- `/app/frontend/src/i18n/locales/ar.json` - Traductions arabes (~625 clés)
- `/app/frontend/src/components/LanguageSelector.js` - Sélecteur de langue
- `/app/frontend/src/components/CookieConsent.js` - Popup cookies
- `/app/frontend/src/components/VisitorTracker.js` - Tracking visiteurs
- `/app/frontend/src/pages/CookiePolicy.js` - Page politique cookies
- `/app/frontend/src/pages/admin/AdminPanel.js` - Panel admin complet
- `/app/frontend/src/pages/auth/Login.js` - Page connexion traduite
- `/app/frontend/src/pages/auth/Register.js` - Page inscription traduite
- `/app/frontend/src/pages/Dashboard.js` - Dashboard traduit
- `/app/frontend/src/pages/Profile.js` - Profil traduit
- `/app/frontend/src/pages/requests/NewRequest.js` - Nouvelle demande traduite
- `/app/frontend/src/pages/requests/RequestsList.js` - Liste demandes traduite
- `/app/frontend/src/pages/offers/NewOffer.js` - Nouvelle offre traduite
- `/app/frontend/src/pages/offers/OffersList.js` - Liste offres traduite
- `/app/frontend/src/pages/contracts/ContractsList.js` - Liste contrats traduite
- `/app/frontend/src/pages/messages/MessagesList.js` - Messages traduits
- `/app/DEPLOYMENT.md` - Manuel de déploiement VPS

## Prochaines Étapes Potentielles (P1/P2)

### P1 - Priorité Haute
- [ ] Notifications email réelles (SendGrid/Resend)
- [ ] Vérification téléphone réelle (Twilio)
- [ ] WebSocket pour messagerie temps réel
- [ ] Géolocalisation et suggestions de villes
- [ ] Paiement PayPal en mode Production

### P2 - Priorité Moyenne
- [ ] Application mobile (React Native)
- [ ] Suivi GPS des colis
- [ ] Système de réservation avec calendrier
- [ ] Assurance colis
- [ ] Tableau de bord analytics avancé

### Fait - Multi-langue ✅
- [x] Traduction complète du site en FR/EN/AR (COMPLET)

## Notes Techniques
- MongoDB pour stockage flexible des documents
- Uploads stockés localement dans /uploads (extensible vers S3)
- JWT avec refresh token pour sessions longues
- CORS configuré pour production
- PayPal en mode Sandbox (à passer en Live pour production)
- Logging structuré actif
- Manuel de déploiement disponible dans `/app/DEPLOYMENT.md`
