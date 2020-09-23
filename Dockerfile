FROM node:alpine

WORKDIR /usr/src/app
COPY . .

RUN npm install && \
    npm run build-for-docker && \
    sh copy-configs.sh

EXPOSE 3000
ENTRYPOINT [ "npm", "start" ]