require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
const resignationRoutes = require('./routes/resignationRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/resignations', resignationRoutes);

const seedDB = require('./config/seed');
seedDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
