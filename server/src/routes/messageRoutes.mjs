import express from 'express';
import {
    createMessage,
    deleteMessage,
    getMessages,
    updateMessage,
} from '../controllers/messageController.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router()

router.post('/:configurationId', requireAuth, createMessage)
router.get('/:configurationId', requireAuth, getMessages)
router.put('/:id', requireAuth, updateMessage)
router.delete('/:id', requireAuth, deleteMessage)

export default router
