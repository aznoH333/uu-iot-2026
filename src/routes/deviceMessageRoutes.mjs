import express from 'express';
import {
    createDeviceMessage,
    deleteDeviceMessage,
    getDeviceMessageById,
    getDeviceMessages,
    updateDeviceMessage,
} from '../controllers/deviceMessageController.mjs';

const router = express.Router()

router.post('/:deviceId', createDeviceMessage)
router.get('/', getDeviceMessages)
router.get('/:id', getDeviceMessageById)
router.put('/:id', updateDeviceMessage)
router.delete('/:id', deleteDeviceMessage)

export default router
