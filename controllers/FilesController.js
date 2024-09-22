#!/usr/bin/env node
import { ObjectID } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Queue from 'bull';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const fileQueue = new Queue(
  'fileQueue',
  'redis://localhost:6379',
);

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const users = await dbClient.db.collection('users');
    const idObject = new ObjectID(userId);
    return users.findOne({ _id: idObject }, async (err, user) => {
      if (err) throw err;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name } = req.body;
      const { type } = req.body;
      const { parentId } = req.body || 0;
      const { isPublic } = req.body;
      let { data } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      const acceptedTypes = ['file', 'folder', 'image'];
      const isAccepted = acceptedTypes.includes(type);

      if (!type || !isAccepted) {
        return res.status(400).json({ error: 'Missing type' }); // ccbbc6d9-f54e-4967-be8a-89db3f8bc302
      }

      // return res.status(200).json({data: data, type: type})
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }
      const files = await dbClient.db.collection('files');

      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager/';
      const fileName = `${filePath}${uuidv4()}`;

      /**
       * Check whether the folder is a valid directory.
       *
       * @function isValidDirectory
       * @param {*} dirPath - path to directory
       * @returns {boolean}
      */
      const isValidDirectory = (dirPath) => {
        try {
          return fs.statSync(dirPath).isDirectory();
        } catch (err) {
          return false;
        }
      };

      if (data) {
        const buf = Buffer.from(data, 'base64');
        data = buf.toString('utf-8');

        try { /* Create the filePath directory */
          if (!isValidDirectory(filePath)) {
            fs.mkdir(filePath, () => {
              // console.log('Created');
            });
          }
        } catch (err) {
          /* Raise some error */
          if (err) throw err;
          // console.log('Exists')
        }

        try {
          /* Write to file in the directory `filePath` */
          fs.writeFile(fileName, data, () => {
            // console.log('saved');
          });
        } catch (err) {
          /* Raise some error */
          // console.log('err')
        }
      }

      if (!parentId) {
        const fileInfo = {
          userId,
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentId || 0,
          localPath: fileName,
        };

        return files.insertOne(fileInfo, (err, result) => {
          if (err) throw err;

          fileQueue.add({ fileId: result.insertedId });
          return res.status(201).json({
            id: result.insertedId,
            userId,
            name,
            type,
            isPublic: fileInfo.isPublic,
            parentId: fileInfo.parentId,
          });
        });
      }
      const idObject = new ObjectID(parentId);

      return files.findOne({ _id: idObject }, (err, File) => {
        if (err) throw err;

        if (!File) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (File.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }

        const fileInfo = {
          userId,
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentId || 0,
          localPath: fileName,
        };

        return files.insertOne(fileInfo, (err, result) => {
          if (err) throw err;

          fileQueue.add({ fileId: result.insertedId });
          return res.status(201).json({
            id: result.insertedId,
            userId,
            name,
            type,
            isPublic: fileInfo.isPublic,
            parentId: fileInfo.parentId,
          });
        });
      });
    });
  }
}

module.exports = FilesController;
