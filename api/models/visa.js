const mongoose = require("mongoose");

const visaSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  thumbnail: { type: Object, required: true },
  name: { type: String, required: true },
  flag: { type: Object, required: true },
  created_at: { type: Number, default: Date.now },
});

module.exports = mongoose.model("Visa", visaSchema)
