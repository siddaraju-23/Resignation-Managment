const express = require('express');
const router = express.Router();
const axios = require('axios');
const Resignation = require('../models/Resignation');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendMail } = require('../config/nodemailer');

// Utility to check if a date is a weekend (Sat/Sun)
const isWeekend = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Utility to check for holidays using Calendarific
const checkHolidays = async (date, countryCode) => {
  if (!process.env.CALENDARIFIC_API_KEY) {
    console.error('CALENDARIFIC_API_KEY is not set.');
    return false; // Proceed with submission if API key is missing in dev
  }

  const datePart = date.toISOString().split('T')[0];
  const [year, month, day] = datePart.split('-');

  try {
    const response = await axios.get(
      'https://calendarific.com/api/v2/holidays',
      {
        params: {
          api_key: process.env.CALENDARIFIC_API_KEY,
          country: countryCode,
          year: year,
          month: month,
          day: day,
          type: 'national', // Check for public, federal, and bank holidays
        },
      }
    );

    return response.data.response.holidays.length > 0;
  } catch (error) {
    console.error('Calendarific API error:', error.message);
    // Decide whether to block submission on API error or allow with a warning
    return false; // For now, allow submission if the check fails (safe default)
  }
};

// --- EMPLOYEE ROUTES ---

// @route   POST /api/resignations
// @desc    Employee submits a new resignation request
// @access  Private (Employee)
router.post('/', protect, authorize('Employee'), async (req, res) => {
  const { intendedLastWorkingDay, reason } = req.body;
  const {
    id: employeeId,
    username: employeeUsername,
    countryOfResidence,
  } = req.user;

  if (!intendedLastWorkingDay || !reason) {
    return res
      .status(400)
      .json({ msg: 'Please provide intended last working day and reason.' });
  }

  try {
    const intendedDate = new Date(intendedLastWorkingDay);

    // 1. Weekend Check
    if (isWeekend(intendedDate)) {
      return res.status(400).json({
        msg: 'The intended last working day cannot fall on a weekend.',
      });
    }

    // 2. Holiday Check
    const isHoliday = await checkHolidays(intendedDate, countryOfResidence);
    if (isHoliday) {
      return res.status(400).json({
        msg: 'The intended last working day cannot fall on a public holiday.',
      });
    }

    // Check for existing pending resignation
    const existingResignation = await Resignation.findOne({
      employeeId,
      status: { $in: ['Pending', 'Approved'] },
    });
    if (existingResignation) {
      return res.status(400).json({
        msg: 'You already have a pending or approved resignation request.',
      });
    }

    const newResignation = new Resignation({
      employeeId,
      employeeUsername,
      intendedLastWorkingDay: intendedDate,
      reason,
    });

    const resignation = await newResignation.save();

    // Notification to HR (Admin) - Placeholder logic
    const hrUser = await User.findOne({ role: 'HR' });
    if (hrUser) {
      await sendMail(
        process.env.MAIL_USER, // Sending to the admin/HR email defined in .env
        'New Resignation Request Submitted',
        `<p>Employee <b>${employeeUsername}</b> has submitted a new resignation request.</p>
             <p>Intended Last Day: ${intendedDate.toDateString()}</p>`
      );
    }

    res.json(resignation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/resignations/my-status
// @desc    Employee views their current resignation status
// @access  Private (Employee)
router.get('/my-status', protect, authorize('Employee'), async (req, res) => {
  try {
    const resignation = await Resignation.findOne({
      employeeId: req.user.id,
    }).sort({ submissionDate: -1 });
    if (!resignation) {
      return res.status(404).json({ msg: 'No resignation requests found.' });
    }
    res.json(resignation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/resignations/interview/:id
// @desc    Employee submits Exit Interview
// @access  Private (Employee)
router.put(
  '/interview/:id',
  protect,
  authorize('Employee'),
  async (req, res) => {
    const { cultureRating, managementFeedback, suggestions } = req.body;

    try {
      let resignation = await Resignation.findById(req.params.id);

      if (!resignation || resignation.employeeId.toString() !== req.user.id) {
        return res
          .status(404)
          .json({ msg: 'Resignation request not found or unauthorized' });
      }

      if (resignation.status !== 'Approved') {
        return res.status(400).json({
          msg: 'Exit interview can only be submitted after resignation approval.',
        });
      }

      if (resignation.exitInterviewCompleted) {
        return res
          .status(400)
          .json({ msg: 'Exit interview already completed.' });
      }

      resignation.exitInterviewResponses = {
        cultureRating,
        managementFeedback,
        suggestions,
      };
      resignation.exitInterviewCompleted = true;
      await resignation.save();

      res.json({ msg: 'Exit interview submitted successfully', resignation });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// --- HR ROUTES ---

// @route   GET /api/resignations
// @desc    HR gets all resignation requests
// @access  Private (HR)
router.get('/', protect, authorize('HR'), async (req, res) => {
  try {
    const resignations = await Resignation.find().sort({ submissionDate: -1 });
    res.json(resignations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/resignations/approve/:id
// @desc    HR approves resignation and sets exit date
// @access  Private (HR)
router.put('/approve/:id', protect, authorize('HR'), async (req, res) => {
  const { exitDate } = req.body;

  if (!exitDate) {
    return res.status(400).json({ msg: 'Exit date is required for approval.' });
  }

  try {
    let resignation = await Resignation.findById(req.params.id).populate(
      'employeeId',
      'username'
    );

    if (!resignation) {
      return res.status(404).json({ msg: 'Resignation request not found' });
    }

    if (resignation.status !== 'Pending') {
      return res
        .status(400)
        .json({ msg: `Resignation is already ${resignation.status}.` });
    }

    resignation.status = 'Approved';
    resignation.exitDate = new Date(exitDate);
    await resignation.save();

    // Email Notification to Employee
    await sendMail(
      resignation.employeeId.username, // Assuming username is email-like for Nodemailer
      'Your Resignation Has Been Approved',
      `<p>Dear ${resignation.employeeUsername},</p>
             <p>Your resignation request has been <b>APPROVED</b>.</p>
             <p>Your official **Exit Date** is: <b>${new Date(
               exitDate
             ).toDateString()}</b>.</p>
             <p>Please log in to the application to complete your mandatory **Exit Interview**.</p>`
    );

    res.json(resignation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/resignations/reject/:id
// @desc    HR rejects resignation
// @access  Private (HR)
router.put('/reject/:id', protect, authorize('HR'), async (req, res) => {
  try {
    let resignation = await Resignation.findById(req.params.id).populate(
      'employeeId',
      'username'
    );

    if (!resignation) {
      return res.status(404).json({ msg: 'Resignation request not found' });
    }

    if (resignation.status !== 'Pending') {
      return res
        .status(400)
        .json({ msg: `Resignation is already ${resignation.status}.` });
    }

    resignation.status = 'Rejected';
    resignation.exitDate = null;
    await resignation.save();

    // Email Notification to Employee
    await sendMail(
      resignation.employeeId.username, // Assuming username is email-like for Nodemailer
      'Update on Your Resignation Request',
      `<p>Dear ${resignation.employeeUsername},</p>
             <p>Your resignation request has been <b>REJECTED</b> by HR. Please contact the HR department for more details.</p>`
    );

    res.json(resignation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
