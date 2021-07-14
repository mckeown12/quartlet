# a simple dockerfile for a signaling hub server

FROM resin/raspberry-pi-alpine-node
RUN npm install -g signal-hub
CMD "signalhub listen -p 3003"