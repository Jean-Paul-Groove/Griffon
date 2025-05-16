# --- Build stage ---
    FROM node:22-slim AS build

    WORKDIR /app
    
    # Copy only what we need first (for caching)
    COPY package.json ./
    COPY .yarn .yarn
    COPY .yarnrc.yml ./
    COPY /packages /packages
    
    # Set correct architecture for native dependencies like sharp
    RUN yarn config set supportedArchitectures.os linux \
      && yarn config set supportedArchitectures.cpu x64
    
    # Install production dependencies (skip devDeps if needed)
    RUN yarn install  --mode=skip-build
    
    # Copy source and build it
    COPY . .
    RUN yarn build
    
    # --- Runtime stage ---
    FROM node:22-slim AS runtime
    
    WORKDIR /app
    
    # Copy only built app and node_modules from previous stage
    COPY --from=build /app/dist ./dist
    COPY --from=build /app/node_modules ./node_modules
    COPY --from=build /app/package.json ./package.json
    COPY --from=build /app/packages ./packages
    
    # Set up environment variables
    ARG DB_HOST
    ARG DB_PORT
    ARG DB_USER
    ARG DB_PASSWORD
    ARG DB_NAME
    ARG JWT_SECRET
    ARG JWT_EXPIRATION
    ARG PORT
    ARG FRONT_URL
    ARG COOKIE_SECRET
    ARG ENVIRONMENT
    ARG TZ


    ENV DB_HOST=$DB_HOST
    ENV DB_PORT=$DB_PORT
    ENV DB_USER=$DB_USER
    ENV DB_PASSWORD=$DB_PASSWORD
    ENV DB_NAME=$DB_NAME
    ENV JWT_SECRET=$JWT_SECRET
    ENV JWT_EXPIRATION=$JWT_EXPIRATION
    ENV PORT=$PORT
    ENV FRONT_URL=$FRONT_URL
    ENV COOKIE_SECRET=$COOKIE_SECRET
    ENV ENVIRONMENT=$ENVIRONMENT
    ENV TZ=$TZ
    
    EXPOSE 443
    EXPOSE 7512
    RUN ls dist/src
    CMD ["node", "dist/src/main.js"]