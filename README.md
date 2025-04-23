## Auteurs

lien github : https://github.com/Mohamed-W13/Projet_devops ( repository actuellement public )

LIEN VIDEO PARTIE 1 : https://youtu.be/pDVDrupz--U
LIEN VIDEO PARTIE 2 : https://youtu.be/ghDl6wmbtnI
LIEN VIDEO PARTIE 3 : https://youtu.be/UJ8GHrzi6xE

- Étudiant 1 : Cheriet Mohamed-Wassim 21105974
- Étudiant 2 : Randriamanantena Lucas 28603779

# Projet OPSCI — Partie 1 : Infrastructure de base (Strapi, PostgreSQL, Frontend React)

## Objectif

Mettre en place une plateforme de gestion de produits composée de trois composants principaux :

- Un CMS ( Content Managment System) Strapi pour gérer les produits
- Une base de données PostgreSQL
- Un frontend React connecté à l'API Strapi

## Services inclus dans le docker-compose

| Service     | Rôle                           | Port exposé |
|-------------|--------------------------------|-------------|
| strapi      | CMS pour la gestion des produits | 1337        |
| postgres    | Base de données relationnelle     | 5432        |
| react       | Interface utilisateur (frontend)  | 3000        |

## Étapes de mise en œuvre

### 1. PostgreSQL

Lancement de la base PostgreSQL via Docker :

```bash
docker run -dit -p 5432:5432 \
  -e POSTGRES_PASSWORD=safepassword \
  -e POSTGRES_USER=strapi \
  --name strapi-pg postgres
```

Cette base est utilisée par Strapi pour stocker les collections.

### 2. Strapi

Création du projet Strapi :

```bash
yarn create strapi-app my-strapi-app
```

Choisir le mode avancé et configurer avec PostgreSQL. Une fois créé, un `Dockerfile` peut être ajouté pour containeriser l'application.

Configuration dans `.env` ou `docker-compose.yml` :

```
DATABASE_CLIENT=postgres
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=safepassword
```

### 3. Modèle de collection `product` dans Strapi

La collection doit contenir :

| Champ           | Type        |
|------------------|-------------|
| name            | short text  |
| description     | long text   |
| stock_available | integer     |
| image           | media (image) |
| barcode         | short text  |

> Attention : la création correcte de cette collection est essentielle pour éviter des erreurs dans le frontend.

### 4. Frontend React

Clone du projet frontend :

```bash
git clone https://github.com/arthurescriou/opsci-strapi-frontend.git
cd opsci-strapi-frontend
npm install
```

Configurer le fichier `.env` :

```
REACT_APP_STRAPI_API_URL=http://localhost:1337
REACT_APP_API_TOKEN=<VOTRE_TOKEN_STRAPI>
```

Ce token peut être généré depuis l'interface administrateur Strapi : `http://localhost:1337/admin`

### 5. Composants React fournis

Deux composants clés sont utilisés :

- `ProductCard.js` : composant affichant un produit
- `ApiDebug.js` : utilitaire de test d'appel API

Ces composants se trouvent dans `src/components/`.

### 6. Lancement des services

```bash
docker-compose up --build -d
```

Vérification des conteneurs :

```bash
docker ps
```



## Structure du projet

```
projet_devops/
├── my-strapi-app/            # Projet CMS
├── my-app/                   # Frontend React
│   └── src/components/
│       ├── ApiDebug.js
│       └── ProductCard.js
├── docker-compose.yml
└── README.md
```





# Projet OPSCI — Partie 2 : Architecture Événementielle avec Kafka

## Objectif

Cette partie du projet vise à intégrer un système de gestion des événements en temps réel via Apache Kafka. Les objectifs principaux sont :

- Collecter, traiter et stocker des flux de données (produits, événements, stocks)
- Mettre en place une architecture scalable et résiliente
- Connecter Strapi à Kafka via des producers et des consumers

## Services déployés

Le fichier `docker-compose.yml` instancie les services suivants :

### Infrastructure de base Kafka

| Service     | Port hôte | Rôle                        |
|-------------|-----------|-----------------------------|
| Zookeeper   | 22181     | Coordination Kafka          |
| Kafka       | 9093      | Message broker              |

### Producers Kafka

| Service            | Dossier local                  | Rôle                            |
|--------------------|--------------------------------|---------------------------------|
| product-producer   | kafka/product-producer/        | Génère des produits             |
| event-producer     | kafka/event-producer/          | Génère des événements produits  |
| stock-producer     | kafka/stock-producer/          | Met à jour les niveaux de stock|

### Consumers Kafka

| Service            | Dossier local                  | Rôle                            |
|--------------------|--------------------------------|---------------------------------|
| product-consumer   | kafka/product-consumer/        | Création produit via API Strapi|
| event-consumer     | kafka/event-consumer/          | Ajout d’événements produits     |
| stock-consumer     | kafka/stock-consumer/          | Application des mouvements de stock |

## Topics Kafka

Les messages sont dispatchés selon les topics suivants :

- `product` : Pour la création de produits en masse
- `event` : Pour l’enregistrement d’événements liés aux produits
- `stock` : Pour les mises à jour de stock
- `error` : Pour la gestion des erreurs (à implémenter)

Ces topics sont automatiquement créés grâce à `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true`.

## Configuration

Chaque producer/consumer utilise des variables d’environnement définies dans le `docker-compose.yml`, telles que :

```
BROKER=kafka:9093
STRAPI_TOKEN=<Votre Token API Strapi>
TOPIC=product|event|stock
STRAPI_URL=http://strapi:1337 (pour stock-consumer)
```

## Scripts disponibles

Un script est fourni pour créer manuellement les topics Kafka si besoin.

Nom du script : `topics.sh`

Ainsi qu'un script pour attendre que kafka soit deployer sur le port : `wait_for_kafka.sh`

Un script permettant de simuler un objet connecté qui envoie une mise à jour de stock est fournie 

Nom du script : 'mqtt-publish.js'

## Démarrer les services

```bash
docker-compose up --build -d
```

Vérifiez que tous les services sont bien lancés :

```bash
docker ps
```



## Tests

- Test de création de produit via product-producer
- Test d’événement produit via event-producer
- Test de mise à jour de stock via stock-producer

# Projet OPSCI — Partie 3 : Intégration d’Objets Connectés avec MQTT

## Objectif

Intégrer un système de communication pour objets connectés (IoT) via **MQTT**, en connectant les messages MQTT à Kafka, puis à Strapi. Cette chaîne permet de :
- Recevoir des messages IoT (température, statut, etc.) via MQTT
- Les transmettre automatiquement à Kafka via un connecteur MQTT-Kafka
- Les intégrer dans Strapi grâce à un consumer Kafka

## Architecture MQTT → Kafka → Strapi

```
[Capteur IoT] → [Mosquitto (MQTT broker)] → [MQTT-Kafka Connector] → [Kafka topic] → [Kafka Consumer] → [Strapi]
```

## Services supplémentaires

| Service                  | Rôle                                         | Port exposé |
|--------------------------|----------------------------------------------|-------------|
| mosquitto                | Broker MQTT pour les objets connectés        | 1883        |
| mqtt-kafka-connector     | Relie MQTT à Kafka                           | -           |
| iot-consumer             | Consumer Kafka qui envoie les données à Strapi | -         |

## Topics Kafka utilisés

- `iot-data` : messages envoyés par les objets connectés (e.g. capteurs)
- `error` : gestion des erreurs (optionnel)

## Configuration MQTT-Kafka Connector

Fichier `connect-mqtt.properties` :

```
name=mqtt-connector
connector.class=io.confluent.connect.mqtt.MqttSourceConnector
tasks.max=1
mqtt.server.uri=tcp://mosquitto:1883
mqtt.topics=iot-data
kafka.topic=iot-data
value.converter=org.apache.kafka.connect.converters.ByteArrayConverter
```

## Exemple de message MQTT publié

```
Topic: iot-data
Payload: {"deviceId": "capteur-1", "temp": 23.5, "timestamp": "2025-04-24T12:00:00Z"}
```

## Lancement de l'ensemble de l’infrastructure

```bash
docker-compose up --build -d
```

Vérification :

```bash
docker ps
```
Simulation mqtt-publish.js :

```
node mqtt-publish.js
```

Verification des produits existants : 
```
curl -H "Authorization: Bearer TOKEN" http://localhost:1337/api/products
```

## Structure du projet

```
projet_devops/
├── kafka/
│   ├── product-producer/
│   ├── product-consumer/
│   ├── event-producer/
│   ├── event-consumer/
│   ├── stock-producer/
│   ├── stock-consumer/
│   └── topics.sh
├── my-strapi-app/
├── my-app/ (frontend React)
├── docker-compose.yml
└── README.md
├── mqtt-kafka-connector/           
│   └── connect-mqtt.properties
├── kafka/
│   ├── iot-consumer/              
├── mosquitto/
```
