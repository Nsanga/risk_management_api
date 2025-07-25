const UserProfile = require("../models/userProfile.model");
const Entity = require("../models/entity.model");
const ResponseService = require("./response.service");
const nodemailer = require("nodemailer");
const logger = require("../helpers/logger");

const transporter = nodemailer.createTransport({
  service: "gmail", // Utilisez le service de messagerie de votre choix
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse email
    pass: process.env.EMAIL_PASS, // Votre mot de passe email ou un mot de passe d'application
  },
});

async function createProfile(req, res) {
  try {
    const tenantId = req.tenantId;
    const email = req.body.email;

    // 🔐 Vérifie si le profil existe déjà pour ce tenant
    const existingUser = await UserProfile.findOne({ email, tenantId });

    if (existingUser) {
      return ResponseService.internalServerError(res, {
        message: "Un profil avec cet email existe déjà pour ce tenant.",
      });
    }

    const profileData = req.body;
    profileData.password = process.env.DEFAULT_PASSWORD;
    profileData.tenantId = tenantId; // ✅ Ajout du tenantId au profil

    // 🔐 Vérifie que l'entité appartient bien à ce tenant
    if (profileData.entity) {
      const entity = await Entity.findOne({
        _id: profileData.entity,
        tenantId,
      });

      if (!entity) {
        return ResponseService.badRequest(res, {
          message: "Entité invalide ou non accessible pour ce tenant.",
        });
      }

      profileData.entity = entity._id;
    }

    // ✅ Création du profil
    const newUserProfile = new UserProfile(profileData);
    await newUserProfile.save();

    // ✅ Notification par email si le compte est actif
    if (profileData.activeUser) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: profileData.email,
        subject: "Activation du compte",
        text: `Votre compte a été activé avec succès.\n\nVos informations de connexion sont les suivantes :\n-> User ID: ${profileData.userId}\n🔐 Mot de passe : ${process.env.DEFAULT_PASSWORD}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error("Erreur lors de l'envoi de l'email :", error);
        } else {
          logger.info("Email envoyé :", info.response);
        }
      });
    }

    return ResponseService.created(res, {
      message: "Profil créé avec succès",
      newUserProfile,
    });
  } catch (error) {
    console.error("Erreur lors de la création du profil :", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getProfileById(req, res) {
  try {
    const tenantId = req.tenantId;
    const profileId = req.params.id;
    const profile = await UserProfile.findById({profileId, tenantId});
    if (!profile) {
      return ResponseService.notFound(res, { message: "Profil non trouvé" });
    }
    return ResponseService.success(res, { profile });
  } catch (error) {
    console.error("Erreur lors de la récupération du Profil:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const tenantId = req.tenantId;
    const profileId = req.params.id;
    const updatedData = req.body;

    // Récupérer le profil avant mise à jour pour comparer le champ `activeUser`
    const currentProfile = await UserProfile.findById({profileId, tenantId});

    if (!currentProfile) {
      return ResponseService.notFound(res, { message: "Profile not found" });
    }

    // Mettre à jour le profil
    const profile = await UserProfile.findByIdAndUpdate(
      profileId,
      tenantId,
      updatedData,
      { new: true }
    );

    if (!profile) {
      return ResponseService.notFound(res, { message: "Profile not found" });
    }

    // Vérifier si `activeUser` passe de false à true
    if (!currentProfile.activeUser && updatedData.activeUser) {
      const emails = [updatedData.email];

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails.join(", "),
        subject: "Activation du compte",
        text: `Votre compte à été activé avec succès.\n\nVos informations de connexion sont les suivante:\n-> User id: ${updatedData.userId}\n🔐: ${process.env.DEFAULT_PASSWORD}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error("Error sending email:", error);
        } else {
          logger.info("Email sent:", info.response);
        }
      });
    }

    return ResponseService.success(res, {
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error updating Profile:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteProfile(req, res) {
  try {
    const tenantId = req.tenantId;
    const profileId = req.params.id;
    const profile = await UserProfile.findByIdAndDelete({profileId, tenantId});
    if (!profile) {
      return ResponseService.notFound(res, { message: "Profil non trouvé" });
    }
    return ResponseService.success(res, {
      message: "Profil supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du Profil:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getAllProfiles(req, res) {
  try {
    const tenantId = req.tenantId;
    const profiles = await UserProfile.find({tenantId}).populate({
      path: "entity",
      select: "referenceId description",
      strictPopulate: true,
    });

    return ResponseService.success(res, { profiles });
  } catch (error) {
    console.error("Erreur lors de la récupération des Profils:", error);
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