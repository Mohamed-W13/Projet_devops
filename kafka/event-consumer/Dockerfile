FROM node:18-alpine
COPY . .
RUN yarn
RUN npm install node-fetch
COPY wait-for-kafka.sh /wait-for-kafka.sh
RUN chmod +x /wait-for-kafka.sh
CMD ["/wait-for-kafka.sh","node main.js"]

