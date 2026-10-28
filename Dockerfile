FROM docker.io/arm64v8/nginx:alpine

# DevSecOps: Atualizacao cirurgica forcando upgrade das bibliotecas vulneraveis
RUN apk update && apk upgrade --no-cache \
    brotli-libs \
    curl \
    libcurl

# Remove pagina padrao e publica o site estatico
RUN rm -rf /usr/share/nginx/html/*
COPY app/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
