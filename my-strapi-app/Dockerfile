# Utilisation d’une image Node.js alpine pour la légèreté
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances et installer
COPY package.json yarn.lock ./
RUN yarn install

# Copier le reste du projet
COPY . .

# Construire l’application Strapi
RUN yarn build

# Exposer le port par défaut de Strapi (1337)
EXPOSE 1337

# Lancer Strapi
CMD ["yarn", "develop"]
