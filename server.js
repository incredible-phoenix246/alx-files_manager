#!/usr/bin/env node
/**
 * @module server
 */
import express from 'express';
import routes from './routes';

const PORT = process.env.PORT || 5000;

const server = express();

server.use(express.json());
server.use('/', routes);

/**
 * @function startServer
 */
const startServer = () => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

module.exports = server;
