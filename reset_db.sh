#! /bin/zsh

docker compose -f compose.dev.yml down
docker volume rm kastenliste_kastenliste_dev_db
docker compose -f compose.dev.yml up -d