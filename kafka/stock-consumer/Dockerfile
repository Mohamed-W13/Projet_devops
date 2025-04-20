FROM node:18-alpine
COPY wait-for-kafka.sh /wait-for-kafka.sh
COPY . .
RUN chmod +x /wait-for-kafka.sh
RUN apk add --no-cache curl
# Installer wget
RUN yarn
RUN npm install node-fetch
CMD ["sh","/wait-for-kafka.sh","node main.js"]
