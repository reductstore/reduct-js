FROM node:17-slim

WORKDIR /src

RUN npm install -g npm@latest

ADD package.json .
ADD package-lock.json .

RUN npm ci

COPY . .

RUN npm run tsc
