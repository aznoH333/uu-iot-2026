import { randomUUID } from 'crypto';
import Device from '../models/Device.mjs';
import DeviceMessage from '../models/DeviceMessage.mjs';
import UserDeviceRelation from '../models/UserDeviceRelation.mjs';

export const createDeviceMessage = async (req, res) => {
    const { deviceId } = req.params
    const { content } = req.body

    if (!deviceId || !content) {
        return res.status(400).json({
            message: 'deviceId and content are required',
        })
    }

    try {
        const device = await Device.findOne({ id: deviceId })

        if (!device) {
            return res.status(404).json({
                message: 'Device not found',
            })
        }

        if (!device.activeUser) {
            return res.status(400).json({
                message: 'Device does not have an active user',
            })
        }

        const activeRelation = await UserDeviceRelation.findOne({ id: device.activeUser })

        if (!activeRelation) {
            return res.status(404).json({
                message: 'Active device relation not found',
            })
        }

        const deviceMessage = await DeviceMessage.create({
            id: randomUUID(),
            messageOrigin: 'user',
            userId: activeRelation.userId,
            deviceId,
            createdDate: new Date(),
            content,
        })

        return res.status(201).json(deviceMessage)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to create device message',
        })
    }
}

export const getDeviceMessages = async (req, res) => {
    const { deviceId } = req.params

    if (!deviceId) {
        return res.status(400).json({
            message: 'deviceId is required',
        })
    }

    try {
        const deviceMessages = await DeviceMessage.find({
            deviceId,
            userId: req.user.id,
        }).sort({ createdDate: 1 })

        return res.status(200).json(deviceMessages)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get device messages',
        })
    }
}

export const updateDeviceMessage = async (req, res) => {
    const { content } = req.body

    if (!content) {
        return res.status(400).json({
            message: 'content is required',
        })
    }

    try {
        const deviceMessage = await DeviceMessage.findOneAndUpdate(
            {
                id: req.params.id,
                userId: req.user.id,
            },
            {
                content,
            },
            {
                returnDocument: 'after',
                runValidators: true,
            },
        )

        if (!deviceMessage) {
            return res.status(404).json({
                message: 'Device message not found',
            })
        }

        return res.status(200).json(deviceMessage)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to update device message',
        })
    }
}

export const deleteDeviceMessage = async (req, res) => {
    try {
        const deviceMessage = await DeviceMessage.findOneAndDelete({
            id: req.params.id,
            userId: req.user.id,
        })

        if (!deviceMessage) {
            return res.status(404).json({
                message: 'Device message not found',
            })
        }

        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to delete device message',
        })
    }
}
