FROM nginx:stable-alpine

#COPY --from=builder /app/.nginx.conf /etc/nginx/conf.d/default.conf
COPY ./dist /usr/share/nginx/html
ARG VITE_API_ADDRESS

ENV VITE_API_ADDRESS = $VITE_API_ADDRESS
EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g","daemon off;"]