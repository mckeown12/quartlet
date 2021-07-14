# a simple dockerfile for a signaling hub server

FROM resin/raspberry-pi-alpine-node
RUN npm install -g signalhub
CMD "signalhub listen -p 3003"