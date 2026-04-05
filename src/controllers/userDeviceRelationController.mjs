import { randomUUID } from 'crypto';
import Device from '../models/Device.mjs';
import UserDeviceRelation from '../models/UserDeviceRelation.mjs';

export const claimDevice = async (req, res) => {
    const { deviceId } = req.body

    if (!deviceId) {
        return res.status(400).json({
            message: 'deviceId is required',
        })
    }

    try {
        const existingRelation = await UserDeviceRelation.findOne({ deviceId })

        if (existingRelation) {
            return res.status(409).json({
                message: 'This device has already been claimed',
            })
        }

        const device = await Device.findOne({ id: deviceId })

        if (!device) {
            return res.status(404).json({
                message: 'Device not found',
            })
        }

        const relation = await UserDeviceRelation.create({
            id: randomUUID(),
            userId: req.user.id,
            deviceId,
            activeConfigurationId: null,
            userRole: 'admin',
        })

        device.activeUser = relation.id
        await device.save()

        return res.status(201).json(relation)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to claim device',
        })
    }
}

export const addUserToDevice = (req, res) => {
    res.status(501).send()
}

export const leaveDevice = (req, res) => {
    res.status(501).send()
}
