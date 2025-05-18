# Use official Node.js image
FROM node:18

# Create app directory (this must be clear)
WORKDIR /index
# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 8080

# Start the app (don’t forget check file type /js/mjs)
CMD ["node", "index.mjs"]
