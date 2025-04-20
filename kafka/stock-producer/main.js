import { Kafka } from 'kafkajs';
import fs from 'fs';
import csv from 'csv-parser';

const BROKER_1 = process.env.BROKER_1 || 'kafka:9093';
const BROKER_2 = process.env.BROKER_2 || 'kafka:9093';
const BROKER_3 = process.env.BROKER_3 || 'kafka:9093';
const TOPIC = process.env.TOPIC || 'stock';
const FILE_NAME = process.env.FILE_NAME || './stocks.csv';  // Assure que ce CSV contient une colonne "id" avec les documentId

const log = (...str) => console.log(`${new Date().toUTCString()}:`, ...str);

const kafka = new Kafka({
  clientId: 'stock-producer',
  brokers: [BROKER_1, BROKER_2, BROKER_3],
});
const producer = kafka.producer();

async function sendToKafka(topic, key, value) {
  try {
    const result = await producer.send({ topic, messages: [{ key, value }] });
    log(`Message sent successfully: ${value}`);
    return result;
  } catch (err) {
    log(`Error sending message: ${err}`);
    throw err;
  }
}

async function main() {
  if (!FILE_NAME) {
    console.error('File name is missing.');
    return;
  }

  await producer.connect();
  const sendPromises = [];

  fs.createReadStream(FILE_NAME)
    .pipe(csv())
    .on('data', (row) => {
      const docId = row['id'];  // documentId directement dans le CSV
      const amount = row['amount'];
      const type = row['type'];
      if (!docId) {
        console.error('Missing documentId in CSV row, skipping:', row);
        return;
      }
      const stock = { id: docId, amount, type };
      const message = JSON.stringify(stock);
      log('Sending:', message);
      sendPromises.push(sendToKafka(TOPIC, docId, message));
    })
    .on('end', async () => {
      try {
        log('Waiting for all messages to be sent...');
        await Promise.all(sendPromises);
        log('All messages have been sent');
      } catch (err) {
        console.error('Error sending messages:', err);
      } finally {
        log('Disconnecting producer...');
        await producer.disconnect();
      }
    })
    .on('error', (err) => {
      console.error('Error reading file:', err);
    });
}

main().catch((err) => {
  console.error(`Error executing the script: ${err}`);
  process.exit(1);
});
