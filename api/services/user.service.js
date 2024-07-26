require("dotenv").config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../models/user.model");

async function save(fullname, email, role) {
  try {
      const user = await User.findOne({ fullname:fullname, email: email, role: role });

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

async function login(email, password) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    if (user.role !== 'admin') {
      return { success: false, error: 'Access denied' };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, error: 'Invalid credentials' };
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return { success: true, token, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function update(email, updatedData) { 
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { $set: updatedData },
      { new: true } // Ceci renvoie le document mis à jour plutôt que l'ancien
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

async function list(role) {
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
      }
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