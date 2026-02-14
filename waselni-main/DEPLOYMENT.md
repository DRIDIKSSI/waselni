# Manuel de Déploiement - Waselni sur VPS Contabo (Ubuntu 24.04 LTS)

## Table des Matières
1. [Prérequis](#1-prérequis)
2. [Configuration Initiale du Serveur](#2-configuration-initiale-du-serveur)
3. [Installation de Docker et Docker Compose](#3-installation-de-docker-et-docker-compose)
4. [Installation et Configuration de MongoDB](#4-installation-et-configuration-de-mongodb)
5. [Déploiement de l'Application](#5-déploiement-de-lapplication)
6. [Configuration Nginx (Reverse Proxy)](#6-configuration-nginx-reverse-proxy)
7. [Certificat SSL avec Let's Encrypt](#7-certificat-ssl-avec-lets-encrypt)
8. [Sauvegarde et Restauration](#8-sauvegarde-et-restauration)
9. [Maintenance et Monitoring](#9-maintenance-et-monitoring)
10. [Configuration PayPal Production](#10-configuration-paypal-production)
11. [Dépannage](#11-dépannage)

---

## 1. Prérequis

### Serveur Contabo recommandé
- **Type**: VPS ou VDS
- **OS**: Ubuntu 24.04 LTS
- **RAM minimum**: 4 Go (recommandé: 8 Go)
- **Disque**: 50 Go SSD minimum
- **CPU**: 2 vCPU minimum

### Domaine
- Un nom de domaine pointant vers l'IP de votre VPS
- Exemple: `waselni.votredomaine.com`

### Accès requis
- Accès SSH root ou utilisateur avec droits sudo
- Clés API PayPal (mode production)

---

## 2. Configuration Initiale du Serveur

### 2.1 Première connexion SSH
```bash
ssh root@VOTRE_IP_CONTABO
```

### 2.2 Mise à jour complète du système
```bash
apt update && apt upgrade -y
apt dist-upgrade -y
apt autoremove -y
```

### 2.3 Configurer le fuseau horaire
```bash
timedatectl set-timezone Europe/Paris
```

### 2.4 Créer un utilisateur dédié (recommandé)
```bash
# Créer l'utilisateur
adduser waselni

# Ajouter aux groupes nécessaires
usermod -aG sudo waselni

# Se connecter avec le nouvel utilisateur
su - waselni
```

### 2.5 Configurer le pare-feu UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 3. Installation de Docker et Docker Compose

### 3.1 Installer les prérequis
```bash
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common
```

### 3.2 Ajouter le repository Docker officiel
```bash
# Ajouter la clé GPG Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Ajouter le repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 3.3 Installer Docker Engine
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Appliquer les changements de groupe
newgrp docker

# Vérifier l'installation
docker --version
docker compose version
```

### 3.4 Configurer Docker pour démarrer au boot
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 4. Installation et Configuration de MongoDB

### Option A: MongoDB via Docker (Recommandé)

MongoDB sera installé automatiquement via docker-compose (voir section 5).

### Option B: MongoDB natif (Alternative)

Si vous préférez installer MongoDB directement sur le serveur:

```bash
# Importer la clé GPG MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Ajouter le repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Installer MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Démarrer et activer MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Vérifier le statut
sudo systemctl status mongod
```

---

## 5. Déploiement de l'Application

### 5.1 Cloner le repository
```bash
cd ~
git clone VOTRE_URL_GIT waselni
cd waselni
```

### 5.2 Créer la structure des fichiers de configuration

#### Fichier backend/.env
```bash
cat > backend/.env << 'EOF'
MONGO_URL=mongodb://mongo:27017
DB_NAME=waselni
CORS_ORIGINS=https://waselni.votredomaine.com
JWT_SECRET=VOTRE_CLE_SECRETE_TRES_LONGUE_ET_COMPLEXE_MIN_32_CARACTERES
PAYPAL_CLIENT_ID=VOTRE_CLIENT_ID_PAYPAL_PRODUCTION
PAYPAL_SECRET=VOTRE_SECRET_PAYPAL_PRODUCTION
PAYPAL_MODE=live
EOF
```

> ⚠️ **Important**: Remplacez `JWT_SECRET` par une chaîne aléatoire d'au moins 32 caractères. Vous pouvez en générer une avec: `openssl rand -hex 32`

#### Fichier frontend/.env
```bash
cat > frontend/.env << 'EOF'
REACT_APP_BACKEND_URL=https://waselni.votredomaine.com
EOF
```

### 5.3 Créer le fichier docker-compose.yml
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Base de données MongoDB
  mongo:
    image: mongo:7.0
    container_name: waselni-mongo
    restart: always
    volumes:
      - mongo_data:/data/db
      - mongo_backup:/data/backup
    networks:
      - waselni-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend FastAPI
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: waselni-backend
    restart: always
    ports:
      - "127.0.0.1:8001:8001"
    env_file:
      - ./backend/.env
    depends_on:
      mongo:
        condition: service_healthy
    volumes:
      - uploads_data:/app/uploads
    networks:
      - waselni-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/api/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend React (build statique servi par Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - REACT_APP_BACKEND_URL=https://waselni.votredomaine.com
    container_name: waselni-frontend
    restart: always
    ports:
      - "127.0.0.1:3000:80"
    depends_on:
      - backend
    networks:
      - waselni-network

volumes:
  mongo_data:
    driver: local
  mongo_backup:
    driver: local
  uploads_data:
    driver: local

networks:
  waselni-network:
    driver: bridge
EOF
```

### 5.4 Créer le Dockerfile Backend
```bash
cat > backend/Dockerfile << 'EOF'
FROM python:3.12-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Créer le dossier uploads
RUN mkdir -p uploads

# Exposer le port
EXPOSE 8001

# Commande de démarrage
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
EOF
```

### 5.5 Créer le Dockerfile Frontend
```bash
cat > frontend/Dockerfile << 'EOF'
# Étape de build
FROM node:20-alpine as build

WORKDIR /app

# Argument pour l'URL backend (passé au build)
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Copier les fichiers de dépendances
COPY package.json yarn.lock ./

# Installer les dépendances
RUN yarn install --frozen-lockfile

# Copier le code source
COPY . .

# Build de production
RUN yarn build

# Étape de production
FROM nginx:1.25-alpine

# Copier le build
COPY --from=build /app/build /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]
EOF
```

### 5.6 Créer la configuration Nginx pour le frontend (interne au conteneur)
```bash
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 256;

    # Cache pour les assets statiques
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - toutes les routes vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Désactiver l'accès aux fichiers cachés
    location ~ /\. {
        deny all;
    }
}
EOF
```

### 5.7 Construire et démarrer les conteneurs
```bash
cd ~/waselni

# Construire les images
docker compose build

# Démarrer les services en arrière-plan
docker compose up -d

# Vérifier que tout fonctionne
docker compose ps
docker compose logs -f
```

### 5.8 Initialiser la base de données
```bash
# Attendre que le backend soit prêt
sleep 10

# Initialiser les données de test
curl -X POST http://localhost:8001/api/seed
```

---

## 6. Configuration Nginx (Reverse Proxy)

### 6.1 Installer Nginx sur l'hôte
```bash
sudo apt install -y nginx
```

### 6.2 Créer la configuration du site
```bash
sudo nano /etc/nginx/sites-available/waselni
```

Contenu du fichier:
```nginx
# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name waselni.votredomaine.com;
    
    # Redirection permanente vers HTTPS
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name waselni.votredomaine.com;

    # Certificats SSL (seront ajoutés par Certbot)
    ssl_certificate /etc/letsencrypt/live/waselni.votredomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/waselni.votredomaine.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Taille maximale des uploads (50 Mo)
    client_max_body_size 50M;

    # Logs
    access_log /var/log/nginx/waselni.access.log;
    error_log /var/log/nginx/waselni.error.log;

    # Frontend (React)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
        proxy_connect_timeout 90;
    }

    # Fichiers uploadés
    location /uploads {
        proxy_pass http://127.0.0.1:8001/uploads;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

### 6.3 Activer le site
```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/waselni /etc/nginx/sites-enabled/

# Supprimer le site par défaut
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration (ignorer les erreurs SSL pour l'instant)
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 7. Certificat SSL avec Let's Encrypt

### 7.1 Installer Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtenir le certificat SSL

**Avant de continuer**, assurez-vous que:
- Votre domaine pointe vers l'IP du serveur (vérifiez avec `ping waselni.votredomaine.com`)
- Les ports 80 et 443 sont ouverts dans le pare-feu

```bash
# Obtenir le certificat (suivez les instructions interactives)
sudo certbot --nginx -d waselni.votredomaine.com

# Entrez votre email et acceptez les conditions
```

### 7.3 Configurer le renouvellement automatique
```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Vérifier que le timer systemd est actif
sudo systemctl status certbot.timer
```

Le renouvellement se fait automatiquement via le timer systemd.

---

## 8. Sauvegarde et Restauration

### 8.1 Script de sauvegarde automatique
```bash
cat > ~/waselni/backup.sh << 'EOF'
#!/bin/bash

# Configuration
BACKUP_DIR="/home/waselni/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Créer le dossier de backup si nécessaire
mkdir -p $BACKUP_DIR

# Backup MongoDB
echo "Sauvegarde MongoDB..."
docker exec waselni-mongo mongodump --out /data/backup/$DATE
docker cp waselni-mongo:/data/backup/$DATE $BACKUP_DIR/mongo_$DATE

# Backup des fichiers uploadés
echo "Sauvegarde des uploads..."
docker cp waselni-backend:/app/uploads $BACKUP_DIR/uploads_$DATE

# Compression
echo "Compression..."
cd $BACKUP_DIR
tar -czf backup_$DATE.tar.gz mongo_$DATE uploads_$DATE
rm -rf mongo_$DATE uploads_$DATE

# Supprimer les anciens backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Sauvegarde terminée: backup_$DATE.tar.gz"
EOF

chmod +x ~/waselni/backup.sh
```

### 8.2 Planifier les sauvegardes (cron)
```bash
# Ouvrir crontab
crontab -e

# Ajouter cette ligne pour une sauvegarde quotidienne à 3h du matin
0 3 * * * /home/waselni/waselni/backup.sh >> /home/waselni/backups/backup.log 2>&1
```

### 8.3 Restaurer une sauvegarde
```bash
# Extraire l'archive
cd ~/backups
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# Restaurer MongoDB
docker cp mongo_YYYYMMDD_HHMMSS waselni-mongo:/data/backup/restore
docker exec waselni-mongo mongorestore /data/backup/restore

# Restaurer les uploads
docker cp uploads_YYYYMMDD_HHMMSS/. waselni-backend:/app/uploads/
```

---

## 9. Maintenance et Monitoring

### 9.1 Commandes utiles
```bash
# Voir les logs en temps réel
docker compose logs -f

# Logs d'un service spécifique
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongo

# Redémarrer un service
docker compose restart backend

# Redémarrer tous les services
docker compose restart

# Arrêter tous les services
docker compose down

# Mettre à jour l'application
cd ~/waselni
git pull origin main
docker compose down
docker compose up -d --build
```

### 9.2 Monitoring avec htop
```bash
sudo apt install -y htop
htop
```

### 9.3 Espace disque
```bash
# Voir l'utilisation du disque
df -h

# Voir l'espace utilisé par Docker
docker system df

# Nettoyer les ressources Docker inutilisées
docker system prune -af
```

### 9.4 Installer Fail2ban (protection anti-bruteforce)
```bash
sudo apt install -y fail2ban

# Créer la configuration
sudo cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5
EOF

# Redémarrer Fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

---

## 10. Configuration PayPal Production

### 10.1 Créer une application PayPal Live
1. Allez sur https://developer.paypal.com/
2. Connectez-vous avec votre compte PayPal Business
3. Allez dans "My Apps & Credentials"
4. Cliquez sur "Create App" en mode **Live**
5. Notez votre **Client ID** et **Secret**

### 10.2 Mettre à jour la configuration
```bash
# Éditer le fichier .env du backend
nano ~/waselni/backend/.env

# Modifier ces lignes:
# PAYPAL_CLIENT_ID=VOTRE_CLIENT_ID_LIVE
# PAYPAL_SECRET=VOTRE_SECRET_LIVE
# PAYPAL_MODE=live

# Redémarrer le backend
cd ~/waselni
docker compose restart backend
```

### 10.3 Tester le paiement
1. Connectez-vous sur votre site en tant qu'expéditeur
2. Créez une demande et acceptez une offre
3. Effectuez un paiement test (avec un montant faible)

---

## 11. Dépannage

### 11.1 L'application ne démarre pas
```bash
# Vérifier les logs
docker compose logs

# Vérifier l'état des conteneurs
docker compose ps

# Reconstruire si nécessaire
docker compose down
docker compose up -d --build
```

### 11.2 Erreur de connexion à MongoDB
```bash
# Vérifier que MongoDB est en cours d'exécution
docker compose logs mongo

# Redémarrer MongoDB
docker compose restart mongo

# Vérifier la connexion
docker exec -it waselni-mongo mongosh
```

### 11.3 Problèmes de certificat SSL
```bash
# Renouveler manuellement le certificat
sudo certbot renew --force-renewal

# Vérifier la configuration Nginx
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 11.4 Erreur 502 Bad Gateway
```bash
# Vérifier que le backend est en cours d'exécution
docker compose ps
docker compose logs backend

# Vérifier les ports
sudo netstat -tlnp | grep -E '8001|3000'

# Redémarrer les services
docker compose restart
```

### 11.5 Problèmes de performance
```bash
# Vérifier l'utilisation des ressources
docker stats

# Augmenter les workers uvicorn si nécessaire
# Éditer backend/Dockerfile, ligne CMD:
# CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
```

### 11.6 Nettoyer l'espace disque
```bash
# Supprimer les images Docker non utilisées
docker image prune -af

# Supprimer tous les conteneurs arrêtés
docker container prune -f

# Supprimer les volumes non utilisés (ATTENTION: données perdues!)
docker volume prune -f

# Nettoyer les logs Docker
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

---

## Informations de Contact

- **Email**: contact@waselni.com
- **Support technique**: support@waselni.com

---

**Document créé le**: Février 2026  
**Version**: 2.0 - Ubuntu 24.04 LTS  
**Dernière mise à jour**: Février 2026
