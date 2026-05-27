const sharp = require('sharp');

/**
 * Processes an avatar image buffer into multiple sizes optimized for GridFS.
 * - original: optimized WebP format
 * - profileView: 400x400 WebP format
 * - commentView: 50x50 WebP format
 * @param {Buffer} buffer - Original image buffer
 * @returns {Promise<{original: Buffer, profileView: Buffer, commentView: Buffer}>}
 */
const processAvatar = async (buffer) => {
    const original = await sharp(buffer)
        .webp({ quality: 85 })
        .toBuffer();

    const profileView = await sharp(buffer)
        .resize(400, 400, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toBuffer();

    const commentView = await sharp(buffer)
        .resize(50, 50, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toBuffer();

    return { original, profileView, commentView };
};

/**
 * Processes a post image buffer into post-size and thumbnail-size WebP formats.
 * - postImage: 1080x1080 WebP format
 * - thumbnail: 250x250 WebP format
 * @param {Buffer} buffer - Original image buffer
 * @returns {Promise<{postImage: Buffer, thumbnail: Buffer}>}
 */
const processPostImage = async (buffer) => {
    const postImage = await sharp(buffer)
        .resize(1080, 1080, { fit: 'cover', position: 'centre' })
        .webp({ quality: 85 })
        .toBuffer();

    const thumbnail = await sharp(buffer)
        .resize(250, 250, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toBuffer();

    return { postImage, thumbnail };
};

module.exports = {
    processAvatar,
    processPostImage
};
