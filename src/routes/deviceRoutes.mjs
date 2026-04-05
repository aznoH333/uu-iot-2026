import express from 'express';
import {
    createDevice,
    deleteDevice,
    getDeviceById,
    getDevices,
    updateDevice,
} from '../controllers/deviceController.mjs';

const router = express.Router()

router.post('/', createDevice)
router.get('/', getDevices)
router.get('/:id', getDeviceById)
router.put('/:id', updateDevice)
router.delete('/:id', deleteDevice)

export default router
