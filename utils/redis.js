#!/usr/bin/env node
/**
 * @module redis
 */

import redis from 'redis';
import util from 'util';

/**
 * Class to represent a redis Client
 */
class RedisClient {
  constructor() {
    this.client = redis.createClient();

    // display errors
    this.client.on('error', (error) => {
      console.log(`Error: ${error}`);
    });

    this.client.on('connect', () => {});
  }

  // Check the connection status and report
  isAlive() {
    return this.client.connected;
  }

  // Get value for a given key from the redis server
  async get(key) {
    const getKey = util.promisify(this.client.get).bind(this.client);
    const val = await getKey(key);
    return val;
  }

  // set the key value pair for redis server
  async set(key, val, time) {
    const setKey = util.promisify(this.client.setex).bind(this.client);
    return setKey(key, time, val);
  }

  // del key value pair from redis server.
  async del(key) {
    const redisDel = util.promisify(this.client.del).bind(this.client);
    await redisDel(key);
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
