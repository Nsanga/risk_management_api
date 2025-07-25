require("dotenv").config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../models/user.model");
const UserProfile = require("../models/userProfile.model");

async function save(fullname, email, role, tenantId) {
  try {
    const user = await User.findOne({ fullname: fullname, email: email, role: role, tenantId });

    if (!user) {
      // User not found, create the user
      const newUser = new User({
        email: email,
        role: role || 'user',
        fullname: fullname,
        password: process.env.DEFAULT_PASSWORD,
      });
      const savedUser = await newUser.save();
      return {
        success: true,
        exist: false,
        data: savedUser,
        message: "User created successfully.",
      };
    } else {
      // User already exists
      return {
        success: false,
        exist: true,
        data: user,
        message: "User already exists.",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error,
      message: "We're sorry, but an internal server error has occurred. Our team has been alerted and is working to resolve the issue. Please try again later.",
    };
  }
}

async function login(userId, password) {
  try {
    // Rechercher l'utilisateur dans UserProfile
    const user = await UserProfile.findOne({ userId });

    // Vérifier si l'utilisateur existe
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Vérifier si l'utilisateur est actif
    if (!user.activeUser) {
      return { success: false, error: 'User is not active' };
    }

    // Comparer le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Inclure tenantId dans le token uniquement si ce n’est pas un superAdmin
    const payload = {
      userId: user._id,
      role: user.role,
    };

    if (user.role !== 'superAdmin') {
      payload.tenantId = user.tenantId;
    }

    // Générer un token JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    return { success: true, token, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function update(email, updatedData, tenantId) {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { $set: updatedData },
      { new: true }, // Ceci renvoie le document mis à jour plutôt que l'ancien
      tenantId
    );
    if (updatedUser) {
      return {
        success: true,
        message: "Utilisateur mis à jour avec succès",
        user: updatedUser,
      };
    } else {
      return { success: false, message: "Utilisateur non trouvé" };
    }
  } catch (error) {
    return {
      success: false,
      message: "Erreur lors de la mise à jour de l'utilisateur",
    };
  }
}

async function getOne(referralCode) {
  try {
    const user = await User.findOne({ referralCode })
    if (user) {
      return { success: true, user };
    } else {
      return { success: false, message: "User not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function list(role, tenantId) {
  try {
    const matchStage = role ? { role } : {};

    const users = await User.aggregate([
      { $match: matchStage },
      {
        $project: {
          email: 1,
          fullname: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      },
      tenantId
    ]);
    if (users.length > 0) {
      return { success: true, total: users.length, users: users };
    } else {
      return { success: true, total: 0, users: [] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  save,
  login,
  list,
  update
};