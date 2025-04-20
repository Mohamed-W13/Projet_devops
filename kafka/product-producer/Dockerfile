FROM node:18-alpine
COPY . .
COPY wait-for-kafka.sh /wait-for-kafka.sh
RUN chmod +x /wait-for-kafka.sh
RUN yarn
RUN npm install node-fetch
CMD ["/wait-for-kafka.sh","node main.js"]

