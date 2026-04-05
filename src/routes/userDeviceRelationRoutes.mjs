import express from 'express';
import {
    addUserToDevice,
    claimDevice,
    leaveDevice,
} from '../controllers/userDeviceRelationController.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router()

router.post('/claim-device', requireAuth, claimDevice)
router.post('/add-user-to-device', requireAuth, addUserToDevice)
router.post('/leave-device', leaveDevice)

export default router
