import { randomUUID } from 'crypto';
import User from '../models/User.mjs';

const USER_PUBLIC_FIELDS = '-_id -loginPassword'

export const createUser = async (req, res) => {
    const { firstName, lastName, loginName, loginPassword } = req.body

    if (!firstName || !lastName || !loginName || !loginPassword) {
        return res.status(400).json({
            message: 'firstName, lastName, loginName, and loginPassword are required',
        })
    }

    try {
        const user = await User.create({
            id: randomUUID(),
            firstName,
            lastName,
            loginName,
            loginPassword,
        })

        return res.status(201).json(user)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to create user',
        })
    }
}

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, USER_PUBLIC_FIELDS)

        return res.status(200).json(users)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get users',
        })
    }
}

export const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id }, USER_PUBLIC_FIELDS)

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            })
        }

        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get user',
        })
    }
}

export const updateUser = (req, res) => {
    res.status(501).send()
}

export const deleteUser = (req, res) => {
    res.status(501).send()
}
