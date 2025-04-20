import { Kafka } from 'kafkajs'
const BROKER_1 = process.env.BROKER_1 || 'kafka:9093'
const BROKER_2 = process.env.BROKER_2 || 'kafka:9093'
const BROKER_3 = process.env.BROKER_3 || 'kafka:9093'
const TOKEN = process.env.STRAPI_TOKEN || '2d2746bef508cce6b990bc58d4d3fa69716be8548a5b51690d1edd3e5887f18830e4acc0b2d763f90763a3bfc1ce699a324872ecdbba97938b56bc280d6de4ebe8a91ba199ba91d4eccb16f8a32628b6254e75fd74dd3e3257df697123599119c518f9ba8e7c7b5d566ba4cf3bac92a1020b38e5286800917e109e97d1dc0072'
const STRAPI_URL = process.env.STRAPI_URL || 'http://strapi:1337'
const TOPIC = process.env.TOPIC || 'stock'
const BEGINNING = process.env.BEGINNING == 'true' || false
const ERROR_TOPIC = process.env.ERROR_TOPIC || 'errors'

const log = (...str) => console.log(`${new Date().toUTCString()}: `, ...str)

const kafka = new Kafka({
  clientId: 'stock-consumer',
  brokers: [BROKER_1, BROKER_2, BROKER_3],
})

const consumer = kafka.consumer({ groupId: 'stock-creator' })
const producer = kafka.producer()

const consume = async () => {
  // Vérifier la connectivité Strapi
  const strapiAvailable = await checkStrapiConnectivity()
  if (!strapiAvailable) {
    log('CRITICAL ERROR: Cannot connect to Strapi, check configuration')
    process.exit(1)
  }

  await Promise.all([consumer.connect(), producer.connect()])
  await consumer.subscribe({ topic: TOPIC, fromBeginning: BEGINNING })

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const strProduct = message.value.toString()
        const stock = JSON.parse(strProduct)
        log('Processing stock update:', strProduct)

        const result = await applyStockChange(stock)
        log('Stock update result:', JSON.stringify(result))
      } catch (error) {
        console.error('Error processing message:', error)
        if (ERROR_TOPIC)
          await producer.send({
            topic: ERROR_TOPIC,
            messages: [{ value: JSON.stringify({ error: error.message, stock: message.value.toString() }) }],
          })
      }
    },
  })
}

// Diagnostic Strapi
async function checkStrapiConnectivity() {
  try {
    log('Testing Strapi connectivity...')
    const response = await fetch(`${STRAPI_URL}/api/products`, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    })
    log(`Strapi API test status: ${response.status}`)
    return response.ok
  } catch (err) {
    log(`Strapi connectivity test error: ${err.message}`)
    return false
  }
}

// Appliquer la mise à jour du stock en recherchant par documentId
async function applyStockChange(stock) {
  if (!stock.id || !stock.type || !stock.amount) throw new Error('invalid format')

  // 1) Filtrer par documentId
  const docId = stock.id
  const filterUrl = `${STRAPI_URL}/api/products?filters[documentId][$eq]=${encodeURIComponent(docId)}`
  log(`Filtering product by documentId=${docId} at ${filterUrl}`)

  const response = await fetch(filterUrl, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
  })
  log(`Filter fetch status: ${response.status}`)

  if (response.status === 404) {
    log(`No product found for documentId=${docId}, skipping.`)
    return
  }
  if (!response.ok) {
    throw new Error(`Failed to filter product ${docId}, status: ${response.status}`)
  }

  const json = await response.json()
  const dataArr = Array.isArray(json.data) ? json.data : []
  if (dataArr.length === 0) {
    log(`Empty result for documentId=${docId}, skipping.`)
    return
  }

  // 2) Récupérer le premier enregistrement
  const record = dataArr[0]
  const numericId = record.id
  // Prendre les attributs soit dans record.attributes soit directement dans record
  const attrs = record.attributes ?? record
  log(`Found product numericId=${numericId} with attributes=${JSON.stringify(attrs)}`)

  // Vérifier la présence de stock_available
  if (attrs.stock_available === undefined) {
    throw new Error(`Product ${numericId} has no stock_available field`)
  }

  // 3) Calcul du nouveau stock
  const amount = Number(stock.amount)
  const change = (stock.type === 'IN' ? 1 : -1) * amount
  const newStock = attrs.stock_available + change
  if (newStock < 0) {
    throw new Error(`Negative stock for product id ${numericId}`)
  }

  // 4) Mettre à jour via PUT
  log(`Updating product ${numericId} with new stock: ${newStock}`)
  const updateRes = await fetch(`${STRAPI_URL}/api/products/${numericId}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { stock_available: newStock } }),
    headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
  })
  if (!updateRes.ok) {
    const errText = await updateRes.text()
    throw new Error(`Failed to update product ${numericId}, status: ${updateRes.status}, ${errText}`)
  }

  const updated = await updateRes.json()
  log(`Update successful for product ${numericId}`)
  return updated
}

log('Starting stock consumer...')
consume().catch((error) => {
  console.error('Fatal error in consumer:', error)
  process.exit(1)
})
