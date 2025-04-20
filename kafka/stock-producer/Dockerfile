FROM node:18-alpine
COPY . .
COPY wait-for-kafka.sh /wait-for-kafka.sh


RUN yarn
RUN npm install node-fetch
RUN chmod +x /wait-for-kafka.sh
ENV PORT 8080
EXPOSE 8080
CMD ["/wait-for-kafka.sh","node main.js"]
