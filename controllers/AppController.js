#!/usr/bin/env node
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * @class AppController
 */
class AppController {
  /* Return if redis and DB is Alive or not */
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };

    res.status(200).json(status);
  }

  /* Return the number of users and files in the DB */
  static async getStats(req, res) {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();

    const stats = {
      users: nbUsers,
      files: nbFiles,
    };

    res.status(200).json(stats);
  }
}

module.exports = AppController;
