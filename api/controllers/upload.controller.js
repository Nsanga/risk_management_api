const UploadService = require('../services/uploadFile.service');
const ResponseService = require('../services/response.service');

async function uploadFile(req, res) {
  const fileName = req.query.fileName;
  const mediaData = req.file.buffer;

  if (!fileName) {
    return ResponseService.badRequest(res, { error: 'fileName parameter is required' });
  }

  try {
    const downloadLink = await UploadService.uploadToCloudinary(fileName, mediaData);
    return ResponseService.success(res, { message: 'File uploaded successfully', downloadLink });
  } catch (error) {
    console.log('Error uploading file:', error);
    return ResponseService.internalServerError(res, { error: 'Error uploading file' });
  }
}

async function uploadMultipleFiles(req, res) {
  const files = req.files;

  if (!files || files.length === 0) {
    return ResponseService.badRequest(res, { error: 'No files provided' });
  }

  try {
    const downloadLinks = await UploadService.uploadMultipleFiles(files);
    return ResponseService.success(res, { message: 'Files uploaded successfully', downloadLinks });
  } catch (error) {
    console.log('Error uploading files:', error);
    return ResponseService.internalServerError(res, { error: 'Error uploading files' });
  }
}

module.exports = {
  uploadFile,
  uploadMultipleFiles
};
