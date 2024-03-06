const mongoose = require("mongoose");

const ticketsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  ticket: { type: Object, required: true },
  name: { type: String, required: true },
  created_at: { type: Number, default: Date.now },
});

module.exports = mongoose.model("Tickets", ticketsSchema);
