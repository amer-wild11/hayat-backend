const mongoose = require("mongoose");

const newsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: { type: String, required: true },
  thumbnail: { type: Object, required: true },
  desc: { type: String, required: true },
  created_at: { type: Number, required: true, default: Date.now },
});

module.exports = mongoose.model("News", newsSchema)