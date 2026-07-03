FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
ENV DATA_DIR=/data
ENV NODE_OPTIONS=--experimental-sqlite

EXPOSE 4000
VOLUME ["/data"]

CMD ["node", "apps/server/dist/index.js"]
