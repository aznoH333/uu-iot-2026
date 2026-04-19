import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
        },
        activeUserRelation: {
            type: String,
        },
    },
    {
        versionKey: false,
    },
)

const Device = mongoose.model('Device', deviceSchema)

export default Device
