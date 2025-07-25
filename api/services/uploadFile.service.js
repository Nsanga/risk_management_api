const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload un fichier local vers Cloudinary dans un dossier spécifique
 * @param {string} filePath - chemin local vers le fichier temporaire
 * @param {string} folder - dossier cloudinary (ex: "tenants/logos")
 * @returns {Promise<string>} - URL du fichier hébergé
 */
exports.uploadToCloudinary = async (filePath, folder) => {
  try {
    const res = await cloudinary.uploader.upload(filePath, { folder });
    // Supprimer le fichier temporaire local après upload
    fs.unlinkSync(filePath);
    return res.secure_url;
  } catch (error) {
    console.error("Erreur upload Cloudinary:", error);
    throw new Error("Échec de l'upload vers Cloudinary");
  }
};
