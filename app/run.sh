#!/bin/sh
cd "(dirname "$0")"
apk update
apk add nodejs npm
npm install
npm run start