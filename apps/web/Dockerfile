FROM node:22-slim AS build

COPY package.json ./
COPY .yarn .yarn
COPY .yarnrc.yml ./
COPY /packages /packages
ARG VITE_API_ADDRESS
ENV VITE_API_ADDRESS = $VITE_API_ADDRESS

RUN yarn install  --mode=skip-build
    
# Copy source and build it
COPY . .
RUN yarn build

FROM nginx:stable-bookworm
WORKDIR /app

COPY --from=build .nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build ./dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g","daemon off;"]