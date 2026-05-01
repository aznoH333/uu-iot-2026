import express from 'express';
import {
    addUserToDevice,
    claimDevice,
    getDeviceRelations,
    leaveDevice,
    setActiveUser,
    setActiveConfiguration,
} from '../controllers/userDeviceRelationController.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router()

router.post('/claim-device', requireAuth, claimDevice)
router.post('/add-user-to-device', requireAuth, addUserToDevice)
router.post('/leave-device', requireAuth, leaveDevice)
router.post('/set-active-user', requireAuth, setActiveUser)
router.post('/set-active-configuration', requireAuth, setActiveConfiguration)
router.get('/device/:deviceId', requireAuth, getDeviceRelations)

export default router
