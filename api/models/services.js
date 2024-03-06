const mongoose = require("mongoose");

const servicesSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: { type: String, required: true },
  desc: { type: String, required: true },
  image: { type: Object, required: true },
});

module.exports = mongoose.model("Services", servicesSchema)