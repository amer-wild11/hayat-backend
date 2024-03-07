const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Hotels = require("../models/hotels");
const checkAuth = require("../midleware/checkAuth");
const fs = require("fs");
const async = require("async");
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
  Hotels.find()
    .then((hotels) => {
      res.status(200).json({
        hotels: hotels,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.get("/:hotel_id", (req, res) => {
  Hotels.findOne({ _id: req.params.hotel_id })
    .then((hotel) => {
      res.status(200).json({
        hotel: hotel,
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
    const hotel = new Hotels({
      _id: new mongoose.Types.ObjectId(),
      thumbnail: req.files.thumbnail[0],
      name: req.body.name,
      desc: req.body.desc,
      location: req.body.location,
      display_images: req.files.display_images,
      rate: req.body.rate,
      offer: req.body.offer,
    });
    hotel
      .save()
      .then((hotel) => {
        res.status(200).json({
          message: "hotel has created",
          hotel: hotel,
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
  Hotels.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "hotels has deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/:hotel_id", (req, res) => {
  Hotels.findOne({ _id: req.params.hotel_id })
    .then((hotel) => {
      if (!hotel) {
        return res.status(404).json({
          message: "Hotel not found",
        });
      }

      // حذف الـ thumbnail إذا كان موجوداً
      if (hotel.thumbnail) {
        fs.unlink(hotel.thumbnail.path, (err) => {
          if (err) {
            console.error("Error deleting thumbnail:", err);
          }
          console.log("Thumbnail deleted successfully");
        });
      }

      // حذف كل الصور المرتبطة بالفندق واحدة تلو الأخرى
      async.eachSeries(
        hotel.display_images,
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

          // بعد حذف الصور، يمكن حذف الفندق نفسه
          Hotels.deleteOne({ _id: req.params.hotel_id })
            .then((result) => {
              res.status(200).json({
                message: "Hotel has been deleted",
                result: result,
              });
            })
            .catch((err) => {
              res.status(500).json({
                message: err,
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
  "/:hotel_id",
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
      const hotel = await Hotels.findOne({ _id: req.params.hotel_id });
      if (hotel.length < 1) {
        return res.status(404).json({
          message: "hotel not found.",
        });
      }

      // تحديث الرحلة
      const result = await Hotels.updateOne(
        { _id: req.params.hotel_id },
        update,
        {
          upsert: true,
        }
      );

      res.status(200).json({
        message: "hotel has been updated.",
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
