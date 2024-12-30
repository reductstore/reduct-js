FROM node:18-slim

WORKDIR /src

RUN npm install -g npm@10

ADD package.json .
ADD package-lock.json .

RUN npm ci

COPY . .

RUN npm run tsc
