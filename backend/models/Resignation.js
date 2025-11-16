const mongoose = require('mongoose');

const ResignationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeUsername: {
    type: String,
    required: true,
  },
  submissionDate: {
    type: Date,
    default: Date.now,
  },
  intendedLastWorkingDay: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  exitDate: {
    type: Date,
    default: null,
  },
  exitInterviewCompleted: {
    type: Boolean,
    default: false,
  },
  exitInterviewResponses: {
    cultureRating: String,
    managementFeedback: String,
    suggestions: String,
  },
});

module.exports = mongoose.model('Resignation', ResignationSchema);
