#!/usr/bin/env node
import Queue from 'bull';
import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Queue(
  'userQueue',
  'redis://localhost:6379',
);

class UsersController {
  static async postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;

    /* Email validation */
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    /* Password validation */
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const users = dbClient.db.collection('users');

    return users.findOne({ email }, (err, user) => {
      if (err) throw err;

      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }

      /* Hash password */
      const hashedPassword = sha1(password);

      const newUser = {
        email,
        password: hashedPassword,
      };

      return users.insertOne(newUser, (err, result) => {
        if (err) throw err;

        userQueue.add({ userId: result.insertedId });
        return res.status(201).json({ id: result.insertedId, email });
      });
    });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const users = await dbClient.db.collection('users');
    const idObject = new ObjectID(userId);
    users.findOne({ _id: idObject }, (err, user) => {
      if (err) throw err;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.status(201).json({ id: userId, email: user.email });
    });
  }
}

module.exports = UsersController;
