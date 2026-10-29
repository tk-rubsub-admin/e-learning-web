FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
# The existing lockfile contains legacy peer-dependency combinations.
RUN npm ci --legacy-peer-deps

COPY . .

ENV NODE_OPTIONS=--max-old-space-size=4096
ARG REACT_APP_NUTALIG_API=/lms-api
ENV REACT_APP_NUTALIG_API=$REACT_APP_NUTALIG_API
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/build ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
ENTRYPOINT ["nginx", "-g", "daemon off;"]
