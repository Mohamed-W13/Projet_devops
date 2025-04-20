#!/bin/bash

# Création des topics avec --zookeeper (ancien Kafka)
docker exec -it kafka \
  kafka-topics.sh --create --topic product --zookeeper zookeeper:2181 --replication-factor 1 --partitions 1

docker exec -it kafka \
  kafka-topics.sh --create --topic event --zookeeper zookeeper:2181 --replication-factor 1 --partitions 1

docker exec -it kafka \
  kafka-topics.sh --create --topic stock --zookeeper zookeeper:2181 --replication-factor 1 --partitions 1

docker exec -it kafka \
  kafka-topics.sh --create --topic error --zookeeper zookeeper:2181 --replication-factor 1 --partitions 1

