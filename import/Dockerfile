FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json ./
# Install deps
RUN (npm ci || npm install --no-audit --no-fund)
# Copy src and build
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN (npm ci --omit=dev || npm install --omit=dev --no-audit --no-fund)
COPY --from=build /app/dist ./dist
# no CMD here; dev.sh will run npm script explicitly
