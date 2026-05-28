const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * GET /api/media/gridfs/:fileId
 * Streams the requested file from MongoDB GridFS.
 */
router.get('/gridfs/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({ message: 'Invalid file ID' });
        }

        if (!mongoose.connection || !mongoose.connection.db) {
            return res.status(500).json({ message: 'Database connection not available' });
        }

        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'media'
        });

        const fileObjectId = new mongoose.Types.ObjectId(fileId);
        
        // Find file metadata first to verify existence and set headers
        const files = await bucket.find({ _id: fileObjectId }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        const file = files[0];
        
        // Set proper content headers
        res.set('Content-Type', file.contentType || 'application/octet-stream');
        res.set('Content-Length', file.length);
        
        // Performance optimization: Cache files for 1 year
        res.set('Cache-Control', 'public, max-age=31536000, immutable');

        // Stream from GridFS directly to the client response
        const downloadStream = bucket.openDownloadStream(fileObjectId);
        
        downloadStream.on('error', (streamErr) => {
            console.error('Error during GridFS download stream:', streamErr);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });

        downloadStream.pipe(res);
    } catch (err) {
        console.error('Error fetching file from GridFS:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
