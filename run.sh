#!/bin/sh
apk update
apk add --no-cache nodejs npm
cd /lzcapp/pkg/content/
ls
# npm install
npm run start