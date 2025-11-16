const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedDB = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'HR',
        countryOfResidence: 'IND',
      });
    }
  } catch (error) {
    console.error('Error seeding HR account:', error.message);
  }
};

module.exports = seedDB;
