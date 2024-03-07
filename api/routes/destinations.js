const express = require("express");
const router = express.Router();
const Dests = require("../models/destinations");
const mongoose = require("mongoose");
const checkAuth = require("../midleware/checkAuth");
const multer = require("multer");
const async = require("async");

const fs = require("fs");

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
  Dests.find()
    .then((Destinations) => {
      res.status(200).json({
        destinations: Destinations,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message,
      });
    });
});

router.get("/:destenation_id", (req, res) => {
  Dests.findOne({ _id: req.params.destenation_id })
    .then((dest) => {
      res.status(200).json({
        destenation: dest,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message,
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
    const dest = new Dests({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      location: req.body.location,
      thumbnail: req.files.thumbnail[0],
      display_images: req.files.display_images,
      rate: req.body.rate,
      desc: req.body.desc,
    });
    dest
      .save()
      .then((dest) => {
        res.status(200).json({
          message: "destenation has created",
          destenation: dest,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message,
        });
      });
  }
);

router.delete("/", checkAuth, (req, res) => {
  Dests.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "all destenations has deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message,
      });
    });
});

router.delete("/:destenation_id", checkAuth, (req, res) => {
  Dests.findOne({ _id: req.params.destenation_id })
    .then((destenation) => {
      if (!destenation) {
        return res.status(404).json({
          message: "Destination not found",
        });
      }

      // حذف الـ thumbnail والـ display_images
      async.eachSeries(
        destenation.display_images,
        (image, callback) => {
          fs.unlink(image.path, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
              return callback(err);
            }
            callback();
          });
        },
        (err) => {
          if (err) {
            return res.status(500).json({
              message: "Error deleting images",
            });
          }
          console.log(destenation.thumbnail);
          fs.unlink(destenation.thumbnail.path, (err) => {
            if (err) {
              console.error("Error deleting thumbnail:", err);
              return res.status(500).json({
                message: "Error deleting thumbnail",
              });
            }

            // حذف الـ destination بعد حذف الـ thumbnail والـ display_images
            Dests.deleteOne({ _id: req.params.destenation_id })
              .then((result) => {
                res.status(200).json({
                  message: "Destination has been deleted",
                  result: result,
                });
              })
              .catch((err) => {
                res.status(500).json({
                  message: err,
                });
              });
          });
        }
      );
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
  "/:dest_id",
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
      const dest = await Dests.findOne({ _id: req.params.dest_id });
      if (dest.length < 1) {
        return res.status(404).json({
          message: "destination not found.",
        });
      }

      if (dest.thumbnail && typeof dest.thumbnail === "object") {
        fs.unlinkSync(dest.thumbnail.path);
      }
      if (dest.display_images && typeof dest.display_images === "array") {
        dest.display_images.forEach((d) => {
          fs.unlinkSync(d.path);
        });
      }

      // تحديث الرحلة
      const result = await Dests.updateOne(
        { _id: req.params.dest_id },
        update,
        {
          upsert: true,
        }
      );

      res.status(200).json({
        message: "destination has been updated.",
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
