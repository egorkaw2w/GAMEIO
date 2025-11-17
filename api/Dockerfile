# api/Dockerfile
FROM node:18-alpine

# Устанавливаем postgresql-client для pg_dump и psql
RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]