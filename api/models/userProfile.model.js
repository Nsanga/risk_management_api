const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userRoles = ['admin', 'user'];

const userProfileSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
  },
  jobTitle: {
    type: String,
  },
  location: {
    type: String,
  },
  telephone: {
    type: String,
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,  // Ajout du champ password
    required: true
  },
  referralCode: {   // Ajout du champ referralCode
    type: String,
    unique: true
  },
  role: {   // Ajout du champ role
    type: String,
    required: true,
    enum: userRoles,
    default: 'user'
  },
  lockedUser: {
    type: Boolean,
    default: false
  },
  userGroup: {
    type: Schema.Types.ObjectId,
    ref: 'UserGroup',
    required: false
  },
  language: {
    type: String,
    required: false
  },
  ccEmailTo: {
    type: String,
    required: false
  },
  nominee: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: false,
    default: 'Pending'
  },
  activeUser: {
    type: Boolean,
    default: false 
  },
  administrator: {
    type: Boolean,
    default: false
  },
  canAuthorize: {
    type: Boolean,
    default: false
  },
  passwordExpiryDate: {
    type: Date,
    required: false
  },
  lockedOutReason: {
    type: String,
    required: false
  },
  entity: {
    type: Schema.Types.ObjectId,
    ref: 'Entity',
    required: false
  }
}, { timestamps: true });

// Pré-enregistrement pour hacher le mot de passe et générer un code de référence
userProfileSchema.pre('save', async function (next) {
  if (this.isNew && !this.referralCode) {
    let code;
    let userProfile;
    do {
      code = generateReferralCode();
      userProfile = await mongoose.models.UserProfile.findOne({ referralCode: code });
    } while (userProfile);
    this.referralCode = code;
  }

  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Fonction pour générer un code de référence
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
