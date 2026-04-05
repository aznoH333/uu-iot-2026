import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { JWT_SECRET } from '../config/jwt.mjs';
import User from '../models/User.mjs';

const USER_PUBLIC_FIELDS = '-_id -loginPassword'
const SCRYPT_KEY_LENGTH = 64
const scrypt = promisify(scryptCallback)

const hashPassword = async (password) => {
    const salt = randomBytes(16).toString('hex')
    const hashedPassword = await scrypt(password, salt, SCRYPT_KEY_LENGTH)

    return `${salt}:${hashedPassword.toString('hex')}`
}

const verifyPassword = async (password, storedPassword) => {
    const [salt, storedHash] = storedPassword.split(':')

    if (!salt || !storedHash) {
        return false
    }

    const hashedPassword = await scrypt(password, salt, SCRYPT_KEY_LENGTH)
    const storedHashBuffer = Buffer.from(storedHash, 'hex')

    if (hashedPassword.length !== storedHashBuffer.length) {
        return false
    }

    return timingSafeEqual(hashedPassword, storedHashBuffer)
}

const canAccessUser = (req, userId) => req.user?.id === userId

export const createUser = async (req, res) => {
    const { firstName, lastName, loginName, loginPassword } = req.body

    if (!firstName || !lastName || !loginName || !loginPassword) {
        return res.status(400).json({
            message: 'firstName, lastName, loginName, and loginPassword are required',
        })
    }

    try {
        const existingUser = await User.findOne({ loginName })

        if (existingUser) {
            return res.status(409).json({
                message: 'A user with this loginName already exists',
            })
        }

        const hashedPassword = await hashPassword(loginPassword)

        const user = await User.create({
            id: randomUUID(),
            firstName,
            lastName,
            loginName,
            loginPassword: hashedPassword,
        })

        return res.status(201).json(user)
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'A user with this loginName already exists',
            })
        }

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

export const loginUser = async (req, res) => {
    const { loginName, loginPassword } = req.body

    if (!loginName || !loginPassword) {
        return res.status(400).json({
            message: 'loginName and loginPassword are required',
        })
    }

    try {
        const user = await User.findOne({ loginName })

        if (!user || !(await verifyPassword(loginPassword, user.loginPassword))) {
            return res.status(401).json({
                message: 'Invalid login credentials',
            })
        }

        const token = jwt.sign(
            {
                id: user.id,
                loginName: user.loginName,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            JWT_SECRET,
            {
                expiresIn: '1h',
            },
        )

        return res.status(200).json({ token })
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to login user',
        })
    }
}

export const updateUser = async (req, res) => {
    if (!canAccessUser(req, req.params.id)) {
        return res.status(403).json({
            message: 'You are not allowed to update this user',
        })
    }

    const { firstName, lastName, loginName, loginPassword } = req.body
    const updates = {}

    if (firstName !== undefined) {
        updates.firstName = firstName
    }

    if (lastName !== undefined) {
        updates.lastName = lastName
    }

    if (loginName !== undefined) {
        updates.loginName = loginName
    }

    if (loginPassword !== undefined) {
        updates.loginPassword = await hashPassword(loginPassword)
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            message: 'At least one field must be provided for update',
        })
    }

    try {
        if (loginName !== undefined) {
            const existingUser = await User.findOne({
                loginName,
                id: { $ne: req.params.id },
            })

            if (existingUser) {
                return res.status(409).json({
                    message: 'A user with this loginName already exists',
                })
            }
        }

        const user = await User.findOneAndUpdate(
            { id: req.params.id },
            updates,
            {
                new: true,
                runValidators: true,
                projection: USER_PUBLIC_FIELDS,
            },
        )

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            })
        }

        return res.status(200).json(user)
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'A user with this loginName already exists',
            })
        }

        return res.status(500).json({
            message: 'Failed to update user',
        })
    }
}

export const deleteUser = async (req, res) => {
    if (!canAccessUser(req, req.params.id)) {
        return res.status(403).json({
            message: 'You are not allowed to delete this user',
        })
    }

    try {
        const user = await User.findOneAndDelete({ id: req.params.id })

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            })
        }

        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to delete user',
        })
    }
}
