const express = require("express");
const router = express.Router();
const Offers = require("../models/offers");
const checkAuth = require("../midleware/checkAuth");
const mongoose = require("mongoose");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // File naming convention
  },
});

const upload = multer({ storage: storage });

router.get("/", (req, res) => {
  Offers.find()
    .then((offers) => {
      res.status(200).json({
        offers: offers,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.get("/:offer_id", (req, res) => {
  Offers.find({ _id: req.params.offer_id })
    .then((offer) => {
      res.status(200).json({
        offer: offer,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.post("/", checkAuth, upload.array("images"), (req, res) => {
  const offer = new Offers({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    images: req.files,
    location: req.body.location,
    desc: req.body.desc,
    offer: req.body.offer,
  });
  offer
    .save()
    .then((offer) => {
      res.status(200).json({
        message: "offer has created",
        offer: offer,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/", checkAuth, (req, res) => {
  Offers.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "offers has deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message,
      });
    });
});

router.delete("/:offer_id", checkAuth, (req, res) => {
  Offers.deleteOne({ _id: req.params.offer_id })
    .then((result) => {
      res.status(200).json({
        message: "offer has deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.patch("/:offer_id", checkAuth, upload.array("images"), (req, res) => {
  const update = {};

  req.body.title ? (update.title = req.body.title) : "";
  req.body.location ? (update.location = req.body.location) : "";
  req.body.desc ? (update.desc = req.body.desc) : "";
  req.body.offer ? (update.offer = req.body.offer) : "";

  if (JSON.stringify(update) == "{}") {
    return res.status(500).json({
      message: "update one thing at least",
    });
  }

  Offers.updateOne({ _id: req.params.offer_id }, update)
    .then((result) => {
      res.status(200).json({
        message: "offer has updated",
        result: result,
      });
    })
    .catch((err) => {
      message: err;
    });
});

module.exports = router;
