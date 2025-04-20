FROM node:18-alpine
COPY . .
RUN yarn
RUN npm install node-fetch
ENV PORT 8080
EXPOSE 8080
COPY wait-for-kafka.sh /wait-for-kafka.sh
RUN chmod +x /wait-for-kafka.sh
CMD ["/wait-for-kafka.sh","node main.js"]
