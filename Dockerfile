FROM docker.io/arm64v8/nginx:alpine

# DevSecOps: Correção cirúrgica de CVEs identificados pelo Trivy
RUN apk update && apk add --no-cache \
    brotli-libs \
    curl \
    libcurl

# Remove página padrão e publica o site estático
RUN rm -rf /usr/share/nginx/html/*
COPY app/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
