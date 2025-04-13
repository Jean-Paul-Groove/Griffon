FROM node:22-slim AS build

COPY package.json ./
COPY .yarnrc.yml ./
COPY /packages /packages

RUN yarn install --immutable --mode=skip-build
COPY . .
RUN yarn build
ARG VITE_API_ADDRESS

FROM nginx:stable-bookworm
COPY --from=build .nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build ./dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g","daemon off;"]