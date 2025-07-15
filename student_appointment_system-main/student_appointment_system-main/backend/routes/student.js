
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const TimeSlot = require('../models/TimeSlot');
const Appointment = require('../models/Appointment');

router.use(auth);

router.get('/timeslots/:professorId', async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
  const { professorId } = req.params;
  const slots = await TimeSlot.find({ professor: professorId, booked: false });
  res.json(slots);
});

router.post('/appointments', async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
  const { professorId, timeSlotId } = req.body;
   const professor = await User.findById(professorId);
  if (!professor || professor.role !== 'professor') {
  return res.status(404).json({ message: 'Professor not found' });
  }
  
  if (!professorId || !timeSlotId) return res.status(400).json({ message: 'Missing professorId or timeSlotId' });

  const slot = await TimeSlot.findById(timeSlotId);
  if (!slot || slot.booked) return res.status(400).json({ message: 'Time slot not available' });

  const appointment = new Appointment({
    student: req.user.id,
    professor: professorId,
    timeSlot: timeSlotId,
    status: 'booked'
  });

  slot.booked = true;
  await slot.save();
  await appointment.save();

  res.status(201).json(appointment);
});

router.get('/appointments', async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });

  const appointments = await Appointment.find({ student: req.user.id, status: 'booked' })
    .populate('professor', 'name email')
    .populate('timeSlot');
  res.json(appointments);
});

module.exports = router;
