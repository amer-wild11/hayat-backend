const express = require("express");
const router = express.Router();
const Resorts = require("../models/resorts");
const mongoose = require("mongoose");
const checkAuth = require("../midleware/checkAuth");
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
  Resorts.find()
    .then((resorts) => {
      res.status(200).json({
        resorts: resorts,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.get("/:resort_id", (req, res) => {
  Resorts.findOne({ _id: req.params.resort_id })
    .then((resort) => {
      res.status(200).json({
        resort: resort,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.post(
  "/",
  checkAuth,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "display_images", maxCount: 5 },
  ]),
  (req, res) => {
    if (!req.files) {
      return res.status(500).json({
        message: "thumbnail is required",
      });
    }
    const resorts = new Resorts({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      location: req.body.location,
      thumbnail: req.files.thumbnail[0],
      display_images: req.files.display_images,
      desc: req.body.desc,
      rate: req.body.rate,
    });
    resorts
      .save()
      .then((resort) => {
        res.status(200).json({
          message: "resort has created",
          resort: resort,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err,
        });
      });
  }
);

router.delete("/", checkAuth, (req, res) => {
  Resorts.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "all resorts has deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/:resorts_id", checkAuth, (req, res) => {
  Resorts.findOne({ _id: req.params.resorts_id })
    .then((resort) => {
      if (!resort) {
        return res.status(404).json({ message: "Resort not found" });
      }
      resort.display_images.forEach((image) => {
        fs.unlink(image.path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully");
          }
        });
      });
      fs.unlink(resort.thumbnail.path, (err) => {
        if (err) {
          console.error("Error deleting thumbnail:", err);
        } else {
          console.log("Thumbnail deleted successfully");
        }
      });
      Resorts.deleteOne({ _id: req.params.resorts_id })
        .then((result) => {
          res.status(200).json({
            message: "Resort has been deleted",
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

const isImageExists = async (imagePath) => {
  try {
    await fs.promises.access(imagePath, fs.constants.F_OK); // Check if the file exists
    return true; // File exists
  } catch (message) {
    if (message.code === "ENOENT") {
      return false; // File does not exist
    } else {
      throw message; // Other message occurred
    }
  }
};

router.patch(
  "/:resort_id",
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
      if (req.body.name) {
        update.name = req.body.name;
      }
      // التحقق مما إذا كان هناك بلد معروف وإضافته إلى التحديث
      if (req.body.desc) {
        update.desc = req.body.desc;
      }
      if (req.body.rate) {
        update.rate = req.body.rate;
      }
      if (req.body.location) {
        update.location = req.body.location;
      }

      // التحقق مما إذا كان هناك أي شيء للتحديث
      if (Object.keys(update).length === 0) {
        return res.status(400).json({
          message: "Please provide at least one field to update.",
        });
      }

      // التحقق مما إذا كانت الرحلة موجودة قبل محاولة التحديث
      const resort = await Resorts.findOne({ _id: req.params.resort_id });
      if (resort.length < 1) {
        return res.status(404).json({
          message: "resort not found.",
        });
      }

      // تحديث الرحلة
      const result = await Resorts.updateOne(
        { _id: req.params.resort_id },
        update,
        {
          upsert: true,
        }
      );

      res.status(200).json({
        message: "resort has been updated.",
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
