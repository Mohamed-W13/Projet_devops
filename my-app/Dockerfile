FROM node:18-alpine

WORKDIR /app

# Copier package.json et package-lock.json (assurez-vous que package-lock.json existe)
COPY package.json package-lock.json ./

# Installer les dépendances avec npm
RUN npm install

# Copier le reste de l'application
COPY . .

# Construire l'application si nécessaire (par exemple, npm run build)
RUN npm run build

# Exposer le port utilisé par votre application (exemple : 3000)
EXPOSE 3000

# Lancer l'application
CMD ["npm", "start"]
