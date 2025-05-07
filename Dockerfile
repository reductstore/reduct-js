FROM node:18-slim

WORKDIR /src

RUN npm install -g npm@10

ADD package.json .

RUN npm ci

COPY . .

RUN npm run tsc
