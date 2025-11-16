const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['HR', 'Employee'],
    default: 'Employee',
  },
  countryOfResidence: {
    type: String,
    required: true,
    default: 'IND',
  },
});

module.exports = mongoose.model('User', UserSchema);
