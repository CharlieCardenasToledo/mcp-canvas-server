FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose environment variables that need to be set
ENV CANVAS_API_TOKEN=""
ENV CANVAS_API_DOMAIN=""

# Run HTTP mode for Render/GPT Actions
CMD ["sh", "-c", "node dist/index.js serve-http --host 0.0.0.0 --port ${PORT:-3000}"]
