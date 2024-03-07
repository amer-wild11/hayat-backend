const express = require("express");
const router = express.Router();
const Trips = require("../models/trips");
const mongoose = require("mongoose");
const checkAuth = require("../midleware/checkAuth");
const multer = require("multer");

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
  Trips.find()
    .then((trips) => {
      res.status(200).json({
        trips: trips,
      });
    })
    .catch((err) => {
      res.status(500).json({
        Error: err,
      });
    });
});

router.get("/:trip_id", (req, res) => {
  Trips.findOne({ _id: req.params.trip_id })
    .then((trip) => {
      res.status(200).json({
        trip: trip,
      });
    })
    .catch((err) => {
      res.status(500).json({
        Error: err,
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
    if (!req.files || !req.files.thumbnail || !req.files.display_images) {
      return res.status(500).json({
        message: "Both thumbnail and display_images are required",
      });
    }
    const trip = new Trips({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      location: req.body.location,
      thumbnail: req.files.thumbnail[0],
      display_images: req.files.display_images,
      rate: req.body.rate,
      desc: req.body.desc,
    });
    trip
      .save()
      .then((trip) => {
        res.status(200).json({
          message: "Trip has been created",
          trip: trip,
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
  Trips.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "all trips has deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        Error: err,
      });
    });
});

router.delete("/:trip_id", checkAuth, (req, res) => {
  Trips.findOne({ _id: req.params.trip_id })
    .then((trip) => {
      if (!trip) {
        return res.status(404).json({
          message: "Trip not found",
        });
      }

      // حذف الصور الفرعية المرتبطة بالرحلة واحدة تلو الأخرى
      async.eachSeries(
        trip.display_images,
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

          // حذف الصورة الرئيسية (الـ thumbnail)
          fs.unlink(trip.thumbnail.path, (err) => {
            if (err) {
              console.error("Error deleting thumbnail:", err);
              return res.status(500).json({
                message: "Error deleting thumbnail",
              });
            }

            // حذف الرحلة بعد حذف الصور
            Trips.deleteOne({ _id: req.params.trip_id })
              .then((result) => {
                res.status(200).json({
                  message: "Trip has been deleted",
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
  } catch (error) {
    if (error.code === "ENOENT") {
      return false; // File does not exist
    } else {
      throw error; // Other error occurred
    }
  }
};

router.patch(
  "/:trip_id",
  checkAuth,
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const update = {};

      // Check if there is a file and add it to the update
      if (req.file) {
        update.thumbnail = req.file;
      }
      // Check if there is a name provided and add it to the update
      if (req.body.name) {
        update.name = req.body.name;
      }
      // Check if there is a description provided and add it to the update
      if (req.body.desc) {
        update.desc = req.body.desc;
      }
      if (req.body.rate) {
        update.rate = req.body.rate;
      }
      if (req.body.location) {
        update.location = req.body.location;
      }

      // Check if there is anything to update
      if (Object.keys(update).length === 0) {
        return res.status(400).json({
          message: "Please provide at least one field to update.",
        });
      }

      // Check if the trip exists before attempting to update
      const trip = await Trips.findOne({ _id: req.params.trip_id });
      if (!trip) {
        return res.status(404).json({
          message: "Trip not found.",
        });
      }

      // Update the trip
      const result = await Trips.updateOne(
        { _id: req.params.trip_id },
        update,
        {
          upsert: true,
        }
      );

      res.status(200).json({
        message: "Trip has been updated.",
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
