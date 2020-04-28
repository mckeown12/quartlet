const path = require('path');

module.exports = {
  entry: './assets/bitcoin.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'assets'),
  },
};