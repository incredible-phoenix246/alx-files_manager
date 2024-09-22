#!/usr/bin/env node
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static getConnect(req, res) {
    const data = req.header('Authorization');

    let userData = data.split(' ')[1];
    const buf = Buffer.from(userData, 'base64');
    userData = buf.toString('utf-8');
    const usData = userData.split(':');

    if (usData.length !== 2) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hashedPassword = sha1(usData[1]);
    const userEmail = usData[0];
    const users = dbClient.db.collection('users');

    users.findOne({ email: userEmail, password: hashedPassword }, async (err, user) => {
      if (err) throw err;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = uuidv4();
      const key = `auth_${token}`;

      await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
      res.status(200).json({ token });
    });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);

    if (!id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await redisClient.del(key);
    res.status(204).json({});
  }
}

module.exports = AuthController;
