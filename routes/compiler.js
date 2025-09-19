import express from 'express';
import { compileAndRunC } from '../controllers/compilerController.js';

const router = express.Router();

router.post('/', compileAndRunC);

export default router;