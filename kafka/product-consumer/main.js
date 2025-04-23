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
const STRAPI_TOKEN ='58cb5bf72c2a03b3d313ced1a1353f834797cdd5b7d8a0a2fe2512385be290e5038e1ad1748be8c12fed275c036a13b36e25b91fda2ad97f907e1f1c1a435e98a41e507fe110baeb396b8e1bb51ae8dc59fd1e887489509639a81dc0645261bb7de4faf1be6ed02d139a12222531f00debd1faebf7838435e8d50b9ed5ad81a9'

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
    
    if (product.stockAvailable !== undefined) {
      product.stock_available = product.stockAvailable;
      delete product.stockAvailable;
    }

    if (product.stockAvailable !== undefined) {
      product.stock_available = product.stockAvailable;
      delete product.stockAvailable;
    }

    const endpoint = `${STRAPI_URL}/api/products/${product.id}`;


    log('🔍 Request details:');
    log('URL:', endpoint);
    log('Method: PUT');
    log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_TOKEN.substring(0, 20)}...`
    });
    const requestBody = {
      data: {
        stock_available: product.stock_available,
      },
    };
    
    log('Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'PUT',
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
