
// special function that handles converting the images only into proper stream

const cloudinary = require('./cloudinary')


const uploadToCloudinary = (buffer, folder, type = 'post', resourceType='image') => {
    // resource type could be either image or video
    // type could be post or avatar

    // create a seperate options object 
    let options = {
        folder: folder,
        resource_type: resourceType
    }
    
    // if we are uploading images we upload it in webp format
    if (resourceType === 'image') {
        // set the options format to webp
        options.format = 'webp'
        
        if (type === 'post') {
            // automatically convert the image into 1:1 ratio for compability across web browsers
            // and mobile browsers
            options.transformation = [
                { height: 1080, width: 1080, crop: 'fill', gravity: "auto" },
                { quality: 'auto' }
            ]
        }
        else if (type === 'avatar') {
            options.transformation = [
                // limit upload sizess to just 1000 x 1000
                { width: 1000, height: 1000, crop: "fill", gravity: "face" },
                { quality: "auto" },
            ]
        }
    }
    else if (resourceType === 'video'){
        // for videos too fix the ratio at 1:1
        options.format = 'mp4' // universal compatibility
        options.transformation = [
            {width:1080,height:1080,crop:'fill'},
            {quality:'auto'}
        ]

    }
    return new Promise((resolve, reject) => {
        // creating a cloudinary upload stream
        const cldUploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (result) resolve(result)
                else reject(error)

            }
        )
        cldUploadStream.end(buffer)
    })

}

module.exports = uploadToCloudinary