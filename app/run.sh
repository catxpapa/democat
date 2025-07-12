#!/bin/sh
apk update
apk add nodejs npm
npm ci --only=production
npm run start