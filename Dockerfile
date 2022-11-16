FROM node:16-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn

COPY index.ts ./
RUN yarn build

CMD node index.js
