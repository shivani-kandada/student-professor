
const mongoose = require('mongoose');
const AppointmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' },
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
});
module.exports = mongoose.model('Appointment', AppointmentSchema);
