## Goal:
A backend for an AI iot device.
The purpose of the device is to serve as an AI voice assistant, something like amazon alexa.
This is a student project so not everything needs to be 100% correct.

## Technology overview
The application should be implemented in JavaScript using Express.js.
The database is mongodb, and should be interfaced with using mongoose.
Endpoints should be secured with jwt. 
Use UUIDs for databse objects and object references.

## Database structure overview
The project needs to have the following database objects
- User
- Device
- UserDeviceRelation
- DeviceMessage
- AssistantConfiguration

### Object detail and fields
#### User
Represents a user of the application/iot device
- id: String
- firstName: String
- lastName: String
- loginName: String
- loginPassword: String
#### Device
Represents a specific physical device
- id: String
- activeUser: String // a reference to a user device relation entity
#### UserDeviceRelation
Stores a users relation to a device
- id: String
- userId: String
- deviceId: String
- activeConfigurationId: String
- userRole: "user" | "admin"
#### DeviceMessage
Represents a message from the user, device or system.
- id: String
- messageOrigin: "user" | "assistant" | "system"
- userId: String
- deviceId: String
- createdDate: Date
- content: String
#### AssistantConfiguration
- id: String
- ownerId: String // user id
- assistantName: String
- systemPrompt: String
- topicRestrictions: String
- assistantVoice: String


## Closing notes
if any implementation details isn't clear ask the user for clarification before writing any code.