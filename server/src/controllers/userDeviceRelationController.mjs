import { randomUUID } from 'crypto';
import AssistantConfiguration from '../models/AssistantConfiguration.mjs';
import Device from '../models/Device.mjs';
import User from '../models/User.mjs';
import UserDeviceRelation from '../models/UserDeviceRelation.mjs';
import { hideMongoId, hideMongoIds } from '../utils/responseUtils.mjs';

export const claimDevice = async (req, res) => {
    const { deviceId, name } = req.body

    if (!deviceId || !name) {
        return res.status(400).json({
            message: 'deviceId and name are required',
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

        device.activeUserRelation = relation.id
        device.name = name
        await device.save()

        return res.status(201).json(hideMongoId(relation))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to claim device',
        })
    }
}

export const addUserToDevice = async (req, res) => {
    const { userId, deviceId } = req.body

    if (!userId || !deviceId) {
        return res.status(400).json({
            message: 'userId and deviceId are required',
        })
    }


    try {
        const adminRelation = await UserDeviceRelation.findOne({
            userId: req.user.id,
            deviceId,
            userRole: 'admin',
        })

        if (!adminRelation) {
            return res.status(403).json({
                message: 'You are not allowed to add users to this device',
            })
        }

        const targetUser = await User.findOne({ id: userId })

        if (!targetUser) {
            return res.status(404).json({
                message: 'User not found',
            })
        }

        const existingRelation = await UserDeviceRelation.findOne({ userId, deviceId })

        if (existingRelation) {
            return res.status(409).json({
                message: 'This user is already assigned to the device',
            })
        }

        const relation = await UserDeviceRelation.create({
            id: randomUUID(),
            userId,
            deviceId,
            activeConfigurationId: null,
            userRole: 'user',
        })

        return res.status(201).json(hideMongoId(relation))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to add user to device',
        })
    }
}

export const leaveDevice = async (req, res) => {
    const { deviceId } = req.body

    if (!deviceId) {
        return res.status(400).json({
            message: 'deviceId is required',
        })
    }

    try {
        const relation = await UserDeviceRelation.findOne({
            userId: req.user.id,
            deviceId,
        })

        if (!relation) {
            return res.status(404).json({
                message: 'User is not assigned to this device',
            })
        }

        const device = await Device.findOne({ id: deviceId })
        let promotedRelation = null

        if (relation.userRole === 'admin') {
            promotedRelation = await UserDeviceRelation.findOneAndUpdate(
                {
                    deviceId,
                    id: { $ne: relation.id },
                },
                {
                    userRole: 'admin',
                },
                {
                    returnDocument: 'after',
                },
            )
        }

        await UserDeviceRelation.deleteOne({ id: relation.id })

        if (device && device.activeUserRelation === relation.id) {
            device.activeUserRelation = promotedRelation ? promotedRelation.id : null
            await device.save()
        }

        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to leave device',
        })
    }
}

export const setActiveConfiguration = async (req, res) => {
    const { userDeviceRelationId, configurationId } = req.body

    if (!userDeviceRelationId || !configurationId) {
        return res.status(400).json({
            message: 'userDeviceRelationId and configurationId are required',
        })
    }

    try {
        const relation = await UserDeviceRelation.findOne({
            id: userDeviceRelationId,
            userId: req.user.id,
        })

        if (!relation) {
            return res.status(404).json({
                message: 'User device relation not found',
            })
        }

        const assistantConfiguration = await AssistantConfiguration.findOne({
            id: configurationId,
            ownerId: req.user.id,
        })

        if (!assistantConfiguration) {
            return res.status(404).json({
                message: 'Assistant configuration not found',
            })
        }

        relation.activeConfigurationId = configurationId
        await relation.save()

        return res.status(200).json(hideMongoId(relation))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to set active configuration',
        })
    }
}

export const setActiveUser = async (req, res) => {
    const { userId, deviceId } = req.body

    if (!userId || !deviceId) {
        return res.status(400).json({
            message: 'userId and deviceId are required',
        })
    }

    try {
        const requesterRelation = await UserDeviceRelation.findOne({
            userId: req.user.id,
            deviceId,
        })

        if (!requesterRelation) {
            return res.status(403).json({
                message: 'You are not allowed to set active user for this device',
            })
        }

        const targetRelation = await UserDeviceRelation.findOne({
            userId,
            deviceId,
        })

        if (!targetRelation) {
            return res.status(404).json({
                message: 'User is not assigned to this device',
            })
        }

        const device = await Device.findOneAndUpdate(
            { id: deviceId },
            { activeUserRelation: targetRelation.id },
            {
                returnDocument: 'after',
                runValidators: true,
            },
        )

        if (!device) {
            return res.status(404).json({
                message: 'Device not found',
            })
        }

        return res.status(200).json(hideMongoId(device))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to set active user',
        })
    }
}

export const getDeviceRelations = async (req, res) => {
    const { deviceId } = req.params

    if (!deviceId) {
        return res.status(400).json({
            message: 'deviceId is required',
        })
    }

    try {
        const requesterRelation = await UserDeviceRelation.findOne({
            userId: req.user.id,
            deviceId,
        })

        if (!requesterRelation) {
            return res.status(403).json({
                message: 'You are not allowed to list relations for this device',
            })
        }

        const relations = await UserDeviceRelation.find({ deviceId })

        return res.status(200).json(hideMongoIds(relations))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get device relations',
        })
    }
}
