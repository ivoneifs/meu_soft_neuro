FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js db.js crypto.js models.js extractText.js ragRetrieval.js ./
EXPOSE 3002
CMD ["node", "index.js"]
