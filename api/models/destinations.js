const mongoose = require("mongoose");

const destSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  thumbnail: { type: Object, required: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  display_images: { type: Array },
  created_at: { type: Number, default: Date.now },
  rate: { type: Number },
  desc: { type: String, required: true },
});

module.exports = mongoose.model("Dests", destSchema);
