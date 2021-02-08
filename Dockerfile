FROM node:alpine

LABEL maintainer="ivan@platoniq.net"

RUN apk add --no-cache sudo imagemagick

ENV HOME=/app

WORKDIR /app
