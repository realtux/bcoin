#!/bin/bash

cd /net/bcoin/explorer
git pull
cd platform
./stop_prod
cd /net/bcoin/explorer/migrations
bmig migrate
cd /net/bcoin/explorer
npm install
./start_prod
