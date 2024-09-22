#!/usr/bin/env node
/**
 * @module db
 */
import mongodb from 'mongodb';
// import 'dotenv';

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || 27017;
const DATABASE = process.env.DB_DATABASE || 'files_manager';

const url = `mongodb://${HOST}: ${PORT}`;
/**
 * class representing the MongoDB Client
 */
class DBClient {
  constructor() {
    this.client = new mongodb.MongoClient(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    this.client
      .connect()
      .then(() => {
        this.db = this.client.db(DATABASE);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  /* Check the connection status of the mongoDB client */
  isAlive() {
    if (this.client.isConnected()) return true;
    return false;
  }

  /* Returns the number of documents in the collection `user` */
  async nbUsers() {
    const users = this.db.collection('users');
    const nb = await users.countDocuments();
    return nb;
  }

  /* Returns the number of documents in the collection `files` */
  async nbFiles() {
    const files = this.db.collection('files');
    const nb = await files.countDocuments();
    return nb;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
