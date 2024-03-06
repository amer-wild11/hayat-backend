const express = require("express");
const router = express.Router();
const Travels = require("../models/travels");
const checkAuth = require("../midleware/checkAuth");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // File naming convention
  },
});

const upload = multer({ storage: storage });

router.get("/", (req, res) => {
  Travels.find()
    .then((travels) => {
      res.status(200).json({
        travels: travels,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message,
      });
    });
});

router.get("/:travel_id", (req, res) => {
  Travels.find({ _id: req.params.travel_id })
    .then((travel) => {
      res.status(200).json({
        travel: travel,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.post("/", checkAuth, upload.single("thumbnail"), (req, res) => {
  if (!req.file) {
    return res.status(500).json({
      message: "travel thumbnail is required",
    });
  }
  const travel = new Travels({
    _id: new mongoose.Types.ObjectId(),
    landmark: req.body.landmark,
    thumbnail: req.file,
    country: req.body.country,
  });
  travel
    .save()
    .then((travel) => {
      res.status(200).json({
        message: "travel has created",
        travel: travel,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/:travel_id", checkAuth, (req, res) => {
  Travels.findOne({ _id: req.params.travel_id })
    .then((travel) => {
      fs.unlink(travel.thumbnail.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return;
        }
        console.log("File deleted successfully");
      });
      Travels.deleteOne({ _id: req.params.travel_id })
        .then((result) => {
          res.status(200).json({
            message: "travel has deleted",
            result: result,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err,
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message,
      });
    });
});

router.delete("/", checkAuth, (req, res) => {
  Travels.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "all travels has deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

const isImageExists = async (imagePath) => {
  try {
    await fs.promises.access(imagePath, fs.constants.F_OK); // Check if the file exists
    return true; // File exists
  } catch (error) {
    if (error.code === "ENOENT") {
      return false; // File does not exist
    } else {
      throw error; // Other error occurred
    }
  }
};

router.patch(
  "/:travel_id",
  checkAuth,
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const update = {};

      // التحقق مما إذا كان هناك ملف وإضافته إلى التحديث
      if (req.file) {
        update.thumbnail = req.file;
      }
      // التحقق مما إذا كان هناك معلم معروف وإضافته إلى التحديث
      if (req.body.landmark) {
        update.landmark = req.body.landmark;
      }
      // التحقق مما إذا كان هناك بلد معروف وإضافته إلى التحديث
      if (req.body.country) {
        update.country = req.body.country;
      }

      // التحقق مما إذا كان هناك أي شيء للتحديث
      if (Object.keys(update).length === 0) {
        return res.status(400).json({
          message: "Please provide at least one field to update.",
        });
      }

      // التحقق مما إذا كانت الرحلة موجودة قبل محاولة التحديث
      const travel = await Travels.findOne({ _id: req.params.travel_id });
      if (!travel) {
        return res.status(404).json({
          message: "Travel not found.",
        });
      }

      // حذف الصورة القديمة إذا كانت موجودة
      if (travel.thumbnail && typeof travel.thumbnail === "string") {
        fs.unlinkSync(travel.thumbnail.path);
      }

      // تحديث الرحلة
      const result = await Travels.updateOne(
        { _id: req.params.travel_id },
        update,
        { upsert: true }
      );

      res.status(200).json({
        message: "Travel has been updated.",
        result: result,
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

module.exports = router;
