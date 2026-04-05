import express from 'express';
import {
    addUserToDevice,
    claimDevice,
    leaveDevice,
} from '../controllers/userDeviceRelationController.mjs';

const router = express.Router()

router.post('/claim-device', claimDevice)
router.post('/add-user-to-device', addUserToDevice)
router.post('/leave-device', leaveDevice)

export default router
