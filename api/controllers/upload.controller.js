const UploadService = require('../services/uploadFile.service');
const ResponseService = require('../services/response.service'); 

async function uploadFiles(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return ResponseService.badRequest(res, { error: 'No files provided' });
    }

    const downloadLinks = await UploadService.uploadFiles(req.files);
    return ResponseService.success(res, { message: 'Files uploaded successfully', downloadLinks });
  } catch (error) {
    console.log('Error uploading files:', error);
    return ResponseService.internalServerError(res, { error: 'Error uploading files' });
  }
}

module.exports = {
  uploadFiles
};
