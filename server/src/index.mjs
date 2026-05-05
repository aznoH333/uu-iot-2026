import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'

import assistantConfigurationRouter from './routes/assistantConfigurationRoutes.mjs'
import messageRouter from './routes/messageRoutes.mjs'
import deviceRouter from './routes/deviceRoutes.mjs'
import userRouter from './routes/userRoutes.mjs'
import userDeviceRelationRouter from './routes/userDeviceRelationRoutes.mjs'

import 'dotenv/config'

const app = express()

const port = process.env.PORT || 3000

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173']

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}))

app.use(express.json({ limit: '10mb' }))

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test'

mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => {
        console.error('MongoDB connection error:', error)
        process.exit(1)
    })

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.use('/users', userRouter)
app.use('/devices', deviceRouter)
app.use('/messages', messageRouter)
app.use('/user-device-relations', userDeviceRelationRouter)
app.use('/assistant-configurations', assistantConfigurationRouter)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})