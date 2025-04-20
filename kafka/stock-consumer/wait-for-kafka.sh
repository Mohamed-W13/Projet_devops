#!/bin/sh

HOST="kafka"
PORT=9093
RETRY_INTERVAL=5

echo "⌛ En attente de Kafka sur ${HOST}:${PORT}..."

# Boucle jusqu'à ce que Kafka soit joignable sur le port 9093
while ! nc -z "${HOST}" "${PORT}"; do
  echo "  Kafka non disponible, nouvelle tentative dans ${RETRY_INTERVAL}s..."
  sleep "${RETRY_INTERVAL}"
done

echo "✅ Kafka est opérationnel sur ${HOST}:${PORT}, lancement de l'application…"
exec node main.js
