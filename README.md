# 🎨 Griffon

**Griffon** est une application web collaborative permettant de jouer à des jeux de dessin en ligne avec vos amis. Dessinez, devinez et amusez-vous en temps réel dans une interface moderne et intuitive.

## ⭐ Fonctionnalités

* 🎮 Jeux de dessin multijoueurs en ligne
* 🖌️ Interface utilisateur en temps réel
* 👥 Création et gestion de salons privés
* 📱 Compatible avec les navigateurs modernes

## 🛠️ Technologies utilisées

* **Frontend** : Vue.js
* **Backend** : Nest.js & Fastify
* **Base de donnée** : Postgres
* **Langage principal** : TypeScript
* **Gestion de projet** : Turborepo
* **Conteneurisation** : Docker

## 📦 Installation

### Prérequis

* [Node.js](https://nodejs.org/) (v16.x ou plus)
* [Yarn](https://yarnpkg.com/)
* [Docker](https://www.docker.com/) (optionnel)

### Installation locale

```bash
git clone https://github.com/Jean-Paul-Groove/Griffon.git
cd Griffon
yarn install
```

## 🚀 Lancement

### Prérequis

Vous devez avoir une base de donnée postgres
Si vous avez Docker d'installé vous pouvez lancer le conteneur comme ceci:

```bash
docker compose up -d
```


### Lancer en mode développement

```bash
yarn dev
```

Rendez-vous sur : [http://localhost:5173](http://localhost:5173)

### Mettre à jour le paquet partagé

Afin de mettre à jour le packet partagé entre le front et le back, utilisez le commande suivante:

```bash
yarn packages
```

Le paquet sera build et mis à jour dans les node_modules des deux parties de l'application




## 🔐 Configuration des variables d'environnement

L'application utilise plusieurs fichiers `.env` pour séparer la configuration des différents composants : base de données, backend (API), et frontend.

### 📁 À la racine du projet (`.env`)

Configuration de la base de données PostgreSQL (notamment utilisée par Docker) :

```env
POSTGRES_USER=griffon_user
POSTGRES_PASSWORD=mot_de_passe_secure
POSTGRES_DB=griffon_db
```

---

### 📁 Backend – `apps/api/.env`

Variables nécessaires au bon fonctionnement de l’API :

```env
# Connexion à la base de données
DB_HOST=localhost
DB_PORT=5432
DB_USER=griffon_user
DB_PASSWORD=mot_de_passe_secure
DB_NAME=griffon_db

# Authentification et sécurité
JWT_SECRET=une_clé_secrète_très_complexe
JWT_EXPIRY=1d
COOKIE_SECRET=encore_une_clé_secrète

# Configuration de l’application
PORT=3001
FRONT_URL=http://localhost:5173
ENVIRONMENT=development
TZ=Europe/Paris
```

---

### 📁 Frontend – `apps/web/.env`

Variable utilisée pour accéder à l’API depuis le frontend :

```env
VITE_API_ADDRESS=http://localhost:3001
```

> ⚠️ Assurez-vous que les ports correspondent à ceux utilisés par votre environnement de développement ou dans `docker-compose.yml`.

---

## 📂 Structure du projet

```
Griffon/
├── apps/
│   ├── api/            # Backend (API Node)
│   └── web/            # Frontend (Vue.js)
├── packages/shared/    # Code partagé, types Event Websocket et DTOs
├── docker-compose.yml
├── dump/
│   ├── specs.sql       # Dump des specs des jeux 
│   └── word.sql        # Dump des mots à deviner
├── .env                # Variables globales (PostgreSQL)
└── turbo.json
```

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE).

---

## 📆 Importer un fichier `.sql` dans la base de données PostgreSQL

Pour initialiser les tables `word` et `game_specs` avec les fichiers fourni dans le dossier dump, suivez ces étapes :

### 🪩 Importer le fichier `.sql`

Utilisez cette commande :

```bash
docker exec -i <CONTAINER> psql -U $POSTGRES_USER $POSTGRES_DB < dump/word.sql
docker exec -i <CONTAINER> psql -U $POSTGRES_USER $POSTGRES_DB < dump/specs.sql
```

---

### ✅ Vérification

Connectez-vous au conteneur pour vérifier :

```bash
docker exec -it griffon-db psql -U griffon_user -d griffon_db
```

Puis :

```sql
SELECT * FROM word;
SELECT * FROM game_specs;
```

---
