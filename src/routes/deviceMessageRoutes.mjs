import express from 'express';
import {
    createDeviceMessage,
    deleteDeviceMessage,
    getDeviceMessages,
    updateDeviceMessage,
} from '../controllers/deviceMessageController.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router()

router.post('/:deviceId', createDeviceMessage)
router.get('/:deviceId', requireAuth, getDeviceMessages)
router.put('/:id', requireAuth, updateDeviceMessage)
router.delete('/:id', requireAuth, deleteDeviceMessage)

export default router
