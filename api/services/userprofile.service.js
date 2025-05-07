const UserProfile = require('../models/userProfile.model');
const ResponseService = require('./response.service');
<<<<<<< HEAD
const UploadService = require('./uploadFile.service');
=======
const nodemailer = require('nodemailer');
const logger = require("../helpers/logger");

const transporter = nodemailer.createTransport({
  service: 'gmail', // Utilisez le service de messagerie de votre choix
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse email
    pass: process.env.EMAIL_PASS  // Votre mot de passe email ou un mot de passe d'application
  }
});
>>>>>>> 4729169 (Re-initialisation après suppression du .git)

async function createProfile(req, res) {
  try {
    const profileData = req.body;

<<<<<<< HEAD
    const newUserProfile = new UserProfile(profileData);
    await newUserProfile.save();

    return ResponseService.created(res, newUserProfile);
=======
    profileData.password = process.env.DEFAULT_PASSWORD;

    const newUserProfile = new UserProfile(profileData);
    await newUserProfile.save();

    if (profileData.activeUser) {
      const emails = [profileData.email];

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails.join(', '),
        subject: 'Activation du compte',
        text: `Votre compte à été activé avec succès.\n\nVos informations de connexion sont les suivante::\n-> User id: ${profileData.userId}\n🔐: ${process.env.DEFAULT_PASSWORD}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error('Error sending email:', error);
        } else {
          logger.info('Email sent:', info.response);
        }
      });
    }

    return ResponseService.created(res, { message: 'Profile created successfully', newUserProfile });
>>>>>>> 4729169 (Re-initialisation après suppression du .git)
  } catch (error) {
    console.error('Error creating Profile:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getProfileById(req, res) {
  try {
    const profileId = req.params.id;
    const profile = await UserProfile.findById(profileId);
    if (!profile) {
      return ResponseService.notFound(res, { message: 'Profil non trouvé' });
    }
    return ResponseService.success(res, { profile });
  } catch (error) {
    console.error('Erreur lors de la récupération du Profil:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const profileId = req.params.id;
    const updatedData = req.body;

<<<<<<< HEAD
=======
    // Récupérer le profil avant mise à jour pour comparer le champ `activeUser`
    const currentProfile = await UserProfile.findById(profileId);

    if (!currentProfile) {
      return ResponseService.notFound(res, { message: 'Profile not found' });
    }

    // Mettre à jour le profil
>>>>>>> 4729169 (Re-initialisation après suppression du .git)
    const profile = await UserProfile.findByIdAndUpdate(profileId, updatedData, { new: true });

    if (!profile) {
      return ResponseService.notFound(res, { message: 'Profile not found' });
    }

<<<<<<< HEAD
=======
    // Vérifier si `activeUser` passe de false à true
    if (!currentProfile.activeUser && updatedData.activeUser) {
      const emails = [updatedData.email];

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails.join(', '),
        subject: 'Activation du compte',
        text: `Votre compte à été activé avec succès.\n\nVos informations de connexion sont les suivante:\n-> User id: ${updatedData.userId}\n🔐: ${process.env.DEFAULT_PASSWORD}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error('Error sending email:', error);
        } else {
          logger.info('Email sent:', info.response);
        }
      });
    }

>>>>>>> 4729169 (Re-initialisation après suppression du .git)
    return ResponseService.success(res, { message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Error updating Profile:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteProfile(req, res) {
  try {
    const profileId = req.params.id;
    const profile = await UserProfile.findByIdAndDelete(profileId);
    if (!profile) {
      return ResponseService.notFound(res, { message: 'Profil non trouvé' });
    }
    return ResponseService.success(res, { message: 'Profil supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du Profil:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getAllProfiles(req, res) {
  try {
    const profiles = await UserProfile.find();
    return ResponseService.success(res, { profiles });
  } catch (error) {
    console.error('Erreur lors de la récupération des Profils:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  getAllProfiles,
};
