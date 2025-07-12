#!/bin/sh
apk update
apk add nodejs npm
cd /lzcapp/pkg/content/
ls
npm ci --only=production
npm run start