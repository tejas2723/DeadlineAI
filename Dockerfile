# Stage 1: Build the React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Inject API url relative path so frontend calls match the same origin
ENV REACT_APP_API_URL=/api
RUN npm run build

# Stage 2: Prepare Node.js Express backend
FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production
COPY backend/ ./backend/

# Copy compiled React build assets from Stage 1 into the backend's peer folder
COPY --from=frontend-builder /app/frontend/build ./frontend/build

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/backend
CMD ["node", "server.js"]
