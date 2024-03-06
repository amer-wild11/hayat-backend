const mongoose = require("mongoose");

const resortsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  thumbnail: { type: Object, required: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  display_images: { type: Array, required: true },
  created_at: { type: Number, default: Date.now },
  desc: { type: String, required: true },
  rate: { type: Number },
});

module.exports = mongoose.model("Tourism", resortsSchema);
