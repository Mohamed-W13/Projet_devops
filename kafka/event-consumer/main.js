import { Kafka } from 'kafkajs'
import fetch from 'node-fetch'

const BROKER_1 = process.env.BROKER_1 || 'kafka:9093'
const BROKER_2 = process.env.BROKER_2 || 'kafka:9093'
const BROKER_3 = process.env.BROKER_3 || 'kafka:9093'
//const TOKEN = process.env.STRAPI_TOKEN || 'bf7c1fbf0e2192c7102a867a217e594050e5a3b098fd5adc8d8887f53bc338b56d276d29bbab3be4365f925058c0cc8578b6e7607752be0a9664cd740ed0710a4512909b4190cb927b5847f4df6aa8aaf3b273a23c94da09b4dcf06ebb573ec0b35762580e5f900eca38f0e7868108a6bc9ee1d5815c7719bf5ed425071f385d'
const TOKEN ='e079b7941374b48c662636432577b96aa05d99cc68b4750b76e6590bb644e9bb4b8a4c7e5f3273f3873762ec45deb8e779f0d0130e941d6e694c9d7fe3404f505da20ba9b1d4ef425bd5af69418c1fa7d2c165f4a45079a2ecbff5fa796fb81a057e563e25a94519676d68af4a81c71677e9fb0ef218456bff803ddbeb44d5a9'
const STRAPI_URL = process.env.STRAPI_URL || 'http://strapi:1337'
const TOPIC = process.env.TOPIC || 'event'
const BEGINNING = process.env.BEGINNING == 'true' || 'false'
const ERROR_TOPIC = process.env.ERROR_TOPIC || 'errors'

const log = (...str) => console.log(`${new Date().toUTCString()}: `, ...str)

const kafka = new Kafka({
  clientId: 'event-consumer',
  brokers: [BROKER_1, BROKER_2, BROKER_3],
})

const consumer = kafka.consumer({ groupId: 'event-creator' })
const producer = kafka.producer()

const consume = async () => {
  await Promise.all([consumer.connect(), producer.connect()])
  await consumer.subscribe({ topic: TOPIC, fromBeginning: BEGINNING })

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const strProduct = message.value.toString()
        const event = JSON.parse(strProduct)

        log('📥 Message Kafka reçu :', strProduct)

        const result = await createEvent(event)
        log('✅ Réponse Strapi :', result)

      } catch (error) {
        console.error('❌ Erreur dans consumer:', error.message, error.stack)

        if (ERROR_TOPIC) {
          await producer.send({
            topic: ERROR_TOPIC,
            messages: [{
              value: JSON.stringify({
                error: error.message,
                stack: error.stack,
                originalMessage: message.value.toString(),
              }),
            }],
          })
        }
      }
    },
  })
}

const createEvent = async (event) => {
  try {
    console.log('🚀 Envoi vers Strapi:', JSON.stringify(event, null, 2))

    const res = await fetch(`${STRAPI_URL}/api/events`, {
      method: 'POST',
      body: JSON.stringify({ data: event }),
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'content-type': 'application/json',
      },
    })

    if (res.ok) {
      const response = await res.json()
      return response
    } else {
      const errorText = await res.text()
      console.error(`❌ Erreur HTTP Strapi (${res.status}):`, errorText)
      return { status: res.status, error: errorText }
    }

  } catch (err) {
    console.error('❌ Erreur lors de l’appel à Strapi:', err.message, err.stack)
    return { error: err.message }
  }
}

await consume()
