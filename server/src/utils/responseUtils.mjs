export const hideMongoId = (document) => {
    if (!document) {
        return document
    }

    const value = typeof document.toObject === 'function'
        ? document.toObject()
        : document

    delete value._id

    return value
}

export const hideMongoIds = (documents) => documents.map(hideMongoId)
