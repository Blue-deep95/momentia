const mongoose = require('mongoose');
const { Readable } = require('stream');

/**
 * Uploads a file buffer to MongoDB GridFS.
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Desired filename
 * @param {string} contentType - Mime type of the file
 * @returns {Promise<{fileId: mongoose.Types.ObjectId, filename: string, contentType: string}>}
 */
const uploadToGridFS = (buffer, filename, contentType) => {
    return new Promise((resolve, reject) => {
        if (!mongoose.connection || !mongoose.connection.db) {
            return reject(new Error("Database connection is not established."));
        }

        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'media'
        });

        const uploadStream = bucket.openUploadStream(filename, {
            contentType: contentType
        });

        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);

        readableStream.pipe(uploadStream)
            .on('error', (err) => reject(err))
            .on('finish', () => {
                resolve({
                    fileId: uploadStream.id,
                    filename: filename,
                    contentType: contentType
                });
            });
    });
};

/**
 * Deletes a file from GridFS by its file ID.
 * Handles non-existent files gracefully.
 * @param {string|mongoose.Types.ObjectId} fileId - The ID of the file to delete
 * @returns {Promise<void>}
 */
const deleteFromGridFS = async (fileId) => {
    if (!fileId) return;
    if (!mongoose.connection || !mongoose.connection.db) {
        throw new Error("Database connection is not established.");
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'media'
    });

    try {
        const fileObjectId = new mongoose.Types.ObjectId(fileId);
        // Verify if file exists to prevent standard MongoDB driver throw
        const files = await bucket.find({ _id: fileObjectId }).toArray();
        if (files && files.length > 0) {
            await bucket.delete(fileObjectId);
        }
    } catch (err) {
        console.error(`[GridFS] Error deleting file ID ${fileId}:`, err);
    }
};

module.exports = {
    uploadToGridFS,
    deleteFromGridFS
};
