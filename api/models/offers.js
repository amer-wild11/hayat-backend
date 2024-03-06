const mongoose = require("mongoose");

const offerSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: { type: String, required: true },
  location: { type: String, required: true },
  desc: { type: String, required: true },
  images: { type: Array, required: true },
  offer: { type: Number },
  created_at: { type: Number, required: true, default: Date.now },
});

module.exports = mongoose.model("Offers", offerSchema);
