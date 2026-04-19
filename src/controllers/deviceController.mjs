import { randomUUID } from 'crypto';
import Device from '../models/Device.mjs';
import User from '../models/User.mjs';
import UserDeviceRelation from '../models/UserDeviceRelation.mjs';

const USER_PUBLIC_FIELDS = '-_id -loginPassword'

export const createDevice = async (req, res) => {
    try {
        const device = await Device.create({
            id: randomUUID(),
            activeUserRelation: null,
        })

        return res.status(201).json(device)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to create device',
        })
    }
}

export const getDevices = async (req, res) => {
    try {
        const devices = await Device.find()

        return res.status(200).json(devices)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get devices',
        })
    }
}

export const getDeviceById = async (req, res) => {
    try {
        const device = await Device.findOne({ id: req.params.id })

        if (!device) {
            return res.status(404).json({
                message: 'Device not found',
            })
        }

        return res.status(200).json(device)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get device',
        })
    }
}

export const listDeviceUsers = async (req, res) => {
    try {
        const device = await Device.findOne({ id: req.params.id })

        if (!device) {
            return res.status(404).json({
                message: 'Device not found',
            })
        }

        const relations = await UserDeviceRelation.find({ deviceId: req.params.id })
        const userIds = relations.map((relation) => relation.userId)
        const users = await User.find({ id: { $in: userIds } }, USER_PUBLIC_FIELDS)
        const roleByUserId = new Map(
            relations.map((relation) => [relation.userId, relation.userRole]),
        )
        const usersWithRoles = users.map((user) => ({
            ...user.toObject(),
            userRole: roleByUserId.get(user.id) ?? null,
        }))

        return res.status(200).json(usersWithRoles)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to list device users',
        })
    }
}

export const updateDevice = async (req, res) => {
    const updates = {}

    if (req.body.activeUserRelation !== undefined) {
        updates.activeUserRelation = req.body.activeUserRelation
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            message: 'At least one field must be provided for update',
        })
    }

    try {
        const device = await Device.findOneAndUpdate(
            { id: req.params.id },
            updates,
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

        return res.status(200).json(device)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to update device',
        })
    }
}

export const deleteDevice = async (req, res) => {
    try {
        const device = await Device.findOneAndDelete({ id: req.params.id })

        if (!device) {
            return res.status(404).json({
                message: 'Device not found',
            })
        }

        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to delete device',
        })
    }
}
