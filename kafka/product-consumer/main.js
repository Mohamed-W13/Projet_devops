import fetch from 'node-fetch';
import { Kafka } from 'kafkajs';

// Configuration
const BROKER_1 = process.env.BROKER_1 || 'kafka:9093';
const BROKER_2 = process.env.BROKER_2 || 'kafka:9093';
const BROKER_3 = process.env.BROKER_3 || 'kafka:9093';
const TOPIC = process.env.TOPIC || 'product';
const ERROR_TOPIC = process.env.ERROR_TOPIC || 'errors';
const STRAPI_URL = process.env.STRAPI_URL || 'http://strapi:1337';

// Token hardcoded (pour test uniquement)
const STRAPI_TOKEN ='e079b7941374b48c662636432577b96aa05d99cc68b4750b76e6590bb644e9bb4b8a4c7e5f3273f3873762ec45deb8e779f0d0130e941d6e694c9d7fe3404f505da20ba9b1d4ef425bd5af69418c1fa7d2c165f4a45079a2ecbff5fa796fb81a057e563e25a94519676d68af4a81c71677e9fb0ef218456bff803ddbeb44d5a9'

console.log(new Date().toISOString(), BROKER_1, BROKER_2, BROKER_3);

const kafka = new Kafka({
  clientId: 'product-consumer',
  brokers: [BROKER_1, BROKER_2, BROKER_3],
});

const consumer = kafka.consumer({ groupId: 'product-creator' });
const producer = kafka.producer();

const log = (...args) => console.log(new Date().toISOString(), ...args);

async function sendToStrapi(product) {
  try {
    log('🟢 Nouveau produit reçu :', product);

    const requestBody = { data: product };
    const endpoint = `${STRAPI_URL}/api/products`;

    log('🔍 Request details:');
    log('URL:', endpoint);
    log('Method: POST');
    log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_TOKEN.substring(0, 20)}...`
    });
    log('Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    log('📦 Strapi response:', response.status, responseText);

    if (response.status === 401 || response.status === 405) {
      log('🚫 Requête invalide ou non autorisée. Ignorée pour retry.');
      return;
    }

    if (!response.ok) {
      await producer.send({
        topic: ERROR_TOPIC,
        messages: [
          {
            value: JSON.stringify({
              product,
              error: { status: response.status, message: responseText },
            }),
          },
        ],
      });
      log("⚠️ Produit envoyé dans le topic d'erreurs");
    } else {
      log('✅ Produit créé avec succès dans Strapi');
    }
  } catch (error) {
    log("❌ Erreur lors de l'envoi à Strapi:", error.message);
    await producer.send({
      topic: ERROR_TOPIC,
      messages: [
        {
          value: JSON.stringify({ product, error: { message: error.message } }),
        },
      ],
    });
    log("⚠️ Produit envoyé dans le topic d'erreurs");
  }
}

async function run() {
  log('Try to connect consumer and producer ...');
  await consumer.connect();
  await producer.connect();
  log('consumer and producer connnected !');

  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const product = JSON.parse(message.value.toString());
        await sendToStrapi(product);
      } catch (error) {
        log('❌ Error processing message:', error.message);
      }
    },
  });
}

async function testStrapiConnection() {
  try {
    log('🔍 Testing Strapi connection...');
    const response = await fetch(`${STRAPI_URL}/api`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
    });

    if (response.ok) {
      log('✅ Successfully connected to Strapi API');
      const data = await response.json();
      log('Available endpoints:', Object.keys(data.data || {}).join(', '));
    } else {
      const text = await response.text();
      log('⚠️ Strapi connection test failed:', response.status, text);
    }
  } catch (error) {
    log('❌ Strapi connection test error:', error.message);
  }
}

async function main() {
  try {
    await testStrapiConnection();
    await run();
  } catch (e) {
    log('❌ Error:', e);
    process.exit(1);
  }
}

main();

process.on('SIGTERM', async () => {
  log('Shutting down gracefully...');
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('Shutting down gracefully...');
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
});