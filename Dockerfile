# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Versão/data mostradas no rodapé do app (VersionFooter.jsx) — vêm de fora
# (deploy-manager-skin.sh passa o commit/data de verdade via --build-arg;
# sem isso, fica "dev"). Vite expõe pro client qualquer env var prefixada
# com VITE_ presente no process.env no momento do `npm run build`.
ARG APP_VERSION=dev
ARG BUILD_DATE
ENV VITE_APP_VERSION=$APP_VERSION
ENV VITE_BUILD_DATE=$BUILD_DATE

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
