#!/bin/sh
cd /lzcapp/pkg/content
ls
apk update
apk add nodejs npm
# npm install
npm run start