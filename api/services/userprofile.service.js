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
    const role = req.body.role;

    const isSuperAdmin = role === "superAdmin";

    // 🔐 Vérifie si le profil existe déjà
    const query = isSuperAdmin ? { email } : { email, tenantId };
    const existingUser = await UserProfile.findOne(query);

    if (existingUser) {
      return ResponseService.internalServerError(res, {
        message: "Un profil avec cet email existe déjà.",
      });
    }

    const profileData = req.body;
    profileData.password = process.env.DEFAULT_PASSWORD;

    // ✅ Ajout du tenantId seulement si ce n’est pas un superAdmin
    if (!isSuperAdmin) {
      profileData.tenantId = tenantId;
    }

    // 🔐 Vérifie que l'entité appartient bien à ce tenant (sauf pour superAdmin)
    if (profileData.entity && !isSuperAdmin) {
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

    // ✅ Envoi de l'email si le compte est actif
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
    const role = updatedData.role; // ou tu peux récupérer depuis currentProfile si non modifié

    const isSuperAdmin = role === "superAdmin";

    // 🔍 Récupération du profil en fonction du rôle
    const currentProfile = isSuperAdmin
      ? await UserProfile.findById(profileId)
      : await UserProfile.findOne({ _id: profileId, tenantId });

    if (!currentProfile) {
      return ResponseService.notFound(res, { message: "Profil introuvable" });
    }

    // 🔄 Mise à jour du profil (toujours filtré par tenantId sauf superAdmin)
    const updateQuery = isSuperAdmin
      ? { _id: profileId }
      : { _id: profileId, tenantId };

    const profile = await UserProfile.findOneAndUpdate(updateQuery, updatedData, {
      new: true,
    });

    if (!profile) {
      return ResponseService.notFound(res, { message: "Profil introuvable" });
    }

    // 📩 Envoi de mail si l'utilisateur vient d'être activé
    if (!currentProfile.activeUser && updatedData.activeUser) {
      const emails = [updatedData.email];

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails.join(", "),
        subject: "Activation du compte",
        text: `Votre compte a été activé avec succès.\n\nVos informations de connexion sont les suivantes:\n-> User ID: ${updatedData.userId}\n🔐 Mot de passe : ${process.env.DEFAULT_PASSWORD}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error("Erreur envoi email :", error);
        } else {
          logger.info("Email envoyé :", info.response);
        }
      });
    }

    return ResponseService.success(res, {
      message: "Profil mis à jour avec succès",
      profile,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
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
    const role = req.role; // ou adapte selon où est stockée l'info

    let query = {};
    
    if (role === "admin") {
      query = {
        tenantId,
        role: { $ne: "superAdmin" }, // Exclut les superAdmin
      };
    } else if (role === "superAdmin") {
      // Ne filtre pas sur le tenant, accès à tous les profils
      query = {};
    } else {
      // Autres rôles : on pourrait restreindre ici si besoin
      query = { tenantId };
    }

    const profiles = await UserProfile.find(query).populate({
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