###########################
# Builder stage
###########################
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (leverage cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Build the production bundle
RUN npm run build

###########################
# Runtime stage – serve with Nginx
###########################
FROM nginx:alpine

# Remove default page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets
COPY --from=build /app/build /usr/share/nginx/html

# Optional: custom Nginx config (fallback to SPA routing)
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"] 