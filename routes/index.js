#!/usr/bin/env node
/**
 * @module routes
 */
import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

/* Create a new User */
router.post('/users', UsersController.postNew);

/* Authenticate a user */
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

/* First File */
router.post('/files', FilesController.postUpload);

module.exports = router;
