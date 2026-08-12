FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libreoffice \
       libreoffice-calc \
       libreoffice-writer \
       libreoffice-impress \
       fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
