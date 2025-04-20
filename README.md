## Auteurs

- Étudiant 1 : Cheriet Mohamed-Wassim
- Étudiant 2 : NOM Prénom (Numéro étudiant)

# Projet OPSCI — Partie 1



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
```

