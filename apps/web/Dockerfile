FROM nginx:stable-bookworm

COPY .nginx.conf /etc/nginx/conf.d/default.conf
COPY ./dist /usr/share/nginx/html
ARG VITE_API_ADDRESS

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g","daemon off;"]