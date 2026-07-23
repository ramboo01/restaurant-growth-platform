const http = require('http');
const app = require('./app');
const { PORT } = require('./config/env');
const socketUtils = require('./utils/socket');

const server = http.createServer(app);

// Initialize Socket.io
socketUtils.init(server);

server.listen(PORT, () => {
  console.log(`RestruRent backend listening on port ${PORT}`);
});
