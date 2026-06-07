FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY postcss.config.mjs ./

RUN npm install

COPY . .

RUN npm run build

# Apenas copiar os arquivos compilados para a imagem final
FROM busybox:latest
WORKDIR /app
COPY --from=0 /app/src/public /app/src/public
COPY --from=0 /app/src/views /app/src/views

EXPOSE 3003
