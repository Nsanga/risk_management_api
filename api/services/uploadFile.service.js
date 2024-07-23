const cloudinary = require("cloudinary/lib/cloudinary").v2;

cloudinary.config({
  cloud_name: 'dmfjhas5a',
  api_key: '189519692969834',
  api_secret: '8xsehFp-kRT2Ut5KwXLF8R0gk24'
});

async function uploadToCloudinary(fileName, mediaData) {
  const publicId = fileName.includes('.') ? fileName : `${fileName}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ resource_type: 'auto', public_id: publicId }, (error, result) => {
      if (!error) {
        const downloadLink = result.secure_url;
        resolve(downloadLink);
      } else {
        reject(error);
      }
    }).end(mediaData);
  });
}

async function uploadMultipleFiles(files) {
  const uploadPromises = files.map(file => uploadToCloudinary(file.originalname, file.buffer));
  return Promise.all(uploadPromises);
}

module.exports = {
  uploadToCloudinary,
  uploadMultipleFiles
};
