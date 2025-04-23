const mqtt = require('mqtt');

const options = {
  host: 'localhost',
  port: 9001,
  protocol: 'ws',
};

const client = mqtt.connect(options);

const payload = JSON.stringify({
  id: 34, //  ID du produit à MAJ
  stock_available: 42 //  nouvelle valeur du stock
});

client.on('connect', () => {
  console.log('🟢 Connecté à Mosquitto via WebSocket');
  client.publish('topic', payload, {}, (err) => {
    if (err) {
      console.error(' Échec de publication :', err);
    } else {
      console.log(' Message publié sur le topic MQTT');
    }
    client.end();
  });
});
