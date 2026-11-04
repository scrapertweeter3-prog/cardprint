FROM node:26-alpine
WORKDIR /app
COPY engine.js stdio.js ./
CMD ["node", "stdio.js"]
