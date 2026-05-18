
// special function for deleting images,videos from cloudinary
const cloudinary = require('./cloudinary.js')

const deleteFromCloudinary = async(publicId, resourceType = 'image') =>{

    try{
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })

        // cloudinary returns {result:'ok'} if operation is successful
        if(result.result === 'ok'){
            return {message:'success'}
        }
        else{
            return {message:'File not found or already deleted'}
        }
    }
    catch(err){
        console.log('Error in deleteFromCloudinary function 🤣',err)
        throw err
    }
}

module.exports = deleteFromCloudinary