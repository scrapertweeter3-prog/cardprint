FROM node:26-alpine
WORKDIR /app
COPY engine.js stdio.js ./
RUN ln -s stdio.js server.js
CMD ["node", "stdio.js"]
