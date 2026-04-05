import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        loginName: {
            type: String,
        },
        loginPassword: {
            type: String,
        },
    },
    {
        versionKey: false,
    },
)

const User = mongoose.model('User', userSchema)

export default User
