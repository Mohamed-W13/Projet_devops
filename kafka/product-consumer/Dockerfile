FROM node:18-alpine
COPY . .
COPY wait-for-kafka.sh /wait-for-kafka.sh
RUN npm install node-fetch
RUN chmod +x /wait-for-kafka.sh
RUN yarn
CMD ["/wait-for-kafka.sh","node main.js"]


