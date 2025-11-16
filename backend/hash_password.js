const bcrypt = require('bcryptjs');

const passwordToHash = 'lonewolf@23@#$';
const saltRounds = 10;

bcrypt.hash(passwordToHash, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log(`Password: ${passwordToHash}`);
  console.log(`Hashed Password : ${hash}`);
});
