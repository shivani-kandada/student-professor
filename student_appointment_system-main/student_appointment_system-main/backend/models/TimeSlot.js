
const mongoose = require('mongoose');
const TimeSlotSchema = new mongoose.Schema({
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,  
  time: String,  
  booked: { type: Boolean, default: false },
});
module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
