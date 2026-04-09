FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache python3 py3-pip make g++ linux-headers && \
    ln -sf python3 /usr/bin/python

COPY package.json package-lock.json ./
RUN npm ci && npm rebuild bcrypt --build-from-source

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
