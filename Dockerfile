ARG NODE_VERSION=20.11.1

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/src/app


# Copy the rest of the source files into the image.
COPY . .

RUN npm install --omit=dev
RUN npm ci --omit=dev

RUN chmod +x index-cron.js

# Run the application.
CMD node index-cron.js
