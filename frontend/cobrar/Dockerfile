FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --ignore-scripts --legacy-peer-deps

COPY . .

ARG REACT_APP_API_URL=
ARG REACT_APP_GOOGLE_CLIENT_ID=
ARG REACT_APP_MERCADOPAGO_PUBLIC_KEY=
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID \
    REACT_APP_MERCADOPAGO_PUBLIC_KEY=$REACT_APP_MERCADOPAGO_PUBLIC_KEY \
    GENERATE_SOURCEMAP=false \
    CI=true

RUN npm run build

FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
