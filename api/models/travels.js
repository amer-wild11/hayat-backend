const mongoose = require("mongoose");

const travelsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  landmark: { type: String, required: true },
  thumbnail: { type: Object, required: true },
  country: { type: String, required: true },
  created_at: { type: Number, required: true, default: Date.now },
});

module.exports = mongoose.model("Travels", travelsSchema);
