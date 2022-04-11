FROM node:16

WORKDIR /src
ADD package.json .
ADD package-lock.json .
RUN npm install

ADD . .
