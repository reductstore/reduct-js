FROM node:20-slim

WORKDIR /src

RUN npm install -g npm@10

ADD package.json .

RUN npm i

COPY . .

RUN npm run tsc
