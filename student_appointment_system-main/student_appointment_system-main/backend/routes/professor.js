
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TimeSlot = require('../models/TimeSlot');
const Appointment = require('../models/Appointment');

router.use(auth);

router.post('/timeslots', async (req, res) => {
  if (req.user.role !== 'professor') return res.status(403).json({ message: 'Forbidden' });
  const { date, time } = req.body;
  if (!date || !time) return res.status(400).json({ message: 'Missing date or time' });

  const slot = new TimeSlot({ professor: req.user.id, date, time });
  await slot.save();
  res.status(201).json(slot);
});

// Cancel appointment by professor
router.post('/appointments/:appointmentId/cancel', async (req, res) => {
  if (req.user.role !== 'professor') return res.status(403).json({ message: 'Forbidden' });
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  if (appointment.professor.toString() !== req.user.id) return res.status(403).json({ message: 'Not allowed' });

  appointment.status = 'cancelled';
  await appointment.save();

  // Mark time slot free
  const slot = await TimeSlot.findById(appointment.timeSlot);
  if (slot) {
    slot.booked = false;
    await slot.save();
  }

  res.json({ message: 'Appointment cancelled' });
});

module.exports = router;
