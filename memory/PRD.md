# Waselni - Plateforme de Mise en Relation France ⇄ Tunisie

## Vue d'ensemble
Plateforme de mise en relation entre expéditeurs et transporteurs pour l'envoi de colis entre la France et la Tunisie. Deux modes de transport: terrestre et aérien.

## Date de création
Janvier 2026

## Dernière mise à jour
Février 2026 - Ajout du rôle combiné Expéditeur+Transporteur avec checkboxes

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
4. **SHIPPER_CARRIER** (Double rôle) - Peut envoyer ET transporter des colis ✅ NOUVEAU
5. **ADMIN** - Administration de la plateforme

## Fonctionnalités Implémentées

### Authentification (MISE À JOUR ✅)
- [x] Inscription avec **checkboxes** pour sélection de rôle
- [x] Possibilité de choisir Expéditeur ET Transporteur simultanément
- [x] Options de type de transporteur (Particulier/Pro)
- [x] Résumé du profil sélectionné avant inscription
- [x] Connexion JWT avec access/refresh tokens
- [x] Déconnexion
- [x] Réinitialisation de mot de passe

### Dashboard (MISE À JOUR ✅)
- [x] Actions rapides adaptées selon le rôle
- [x] Double rôle: affiche "Nouvelle demande" ET "Nouvelle offre"
- [x] Badge de rôle "Expéditeur + Transporteur" pour double rôle
- [x] Statistiques complètes

### Gestion des Demandes & Offres
- [x] SHIPPER_CARRIER peut créer des demandes ET des offres
- [x] Permissions backend mises à jour pour le double rôle

## Comptes de Test
- **Admin**: admin@logimatch.com / admin123
- **Expéditeur**: marie@example.com / password123
- **Double rôle**: both@example.com / password123 ✅ NOUVEAU
- **Transporteur Pro**: transport.pro@example.com / password123

## Fichiers Modifiés (Février 2026)
- `/app/backend/server.py` - Ajout rôle SHIPPER_CARRIER + permissions
- `/app/frontend/src/pages/auth/Register.js` - Checkboxes pour sélection de rôle
- `/app/frontend/src/context/AuthContext.js` - Gestion isShipperCarrier
- `/app/frontend/src/pages/Dashboard.js` - Actions rapides pour double rôle
- `/app/frontend/src/i18n/locales/fr.json` - Nouvelles traductions
- `/app/frontend/src/i18n/locales/en.json` - Nouvelles traductions
- `/app/frontend/src/i18n/locales/ar.json` - Nouvelles traductions

## Prochaines Étapes (P1)
- [ ] Suivi GPS en temps réel des colis
- [ ] Notifications email automatiques
- [ ] WebSocket pour messagerie temps réel
- [ ] Toggle mode Expéditeur/Transporteur pour double rôle

## Notes Techniques
- Le rôle SHIPPER_CARRIER hérite des permissions des deux rôles
- Dashboard affiche toutes les actions disponibles pour ce rôle
- Tests: 100% de réussite backend et frontend
