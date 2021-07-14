# a simple dockerfile for a signaling hub server

FROM hypriot/rpi-node
RUN npm install -g signalhub
CMD "signalhub listen -p 3003"