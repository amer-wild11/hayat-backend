const mongoose = require("mongoose");

const hotelsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  thumbnail: { type: Object, required: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
  location: { type: String, required: true },
  display_images: { type: Array, required: true },
  rate: { type: Number, required: true },
  created_at: { type: Number, default: Date.now },
});

module.exports = mongoose.model("Hotels", hotelsSchema);
