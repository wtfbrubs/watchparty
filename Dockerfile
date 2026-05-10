FROM node:24-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /usr/src
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime ----
FROM node:24-alpine

WORKDIR /usr/src
COPY --from=builder /usr/src/node_modules ./node_modules
COPY --from=builder /usr/src/build ./build
COPY --from=builder /usr/src/server ./server
COPY --from=builder /usr/src/words ./words
COPY --from=builder /usr/src/package*.json ./

ENTRYPOINT ["/bin/sh", "-c", "npm start"]