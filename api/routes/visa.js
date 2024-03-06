const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Visa = require("../models/visa");
const multer = require("multer");
const checkAuth = require("../midleware/checkAuth");

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
  Visa.find()
    .then((visas) => {
      res.status(200).json({
        visas: visas,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.get("/:visa_id", (req, res) => {
  Visa.findOne({ _id: req.params.visa_id })
    .then((visa) => {
      res.status(200).json({
        visa: visa,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.post("/", checkAuth, upload.single("thumbnail"), (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(500).json({
      message: "thumbnail is required",
    });
  }
  const visa = new Visa({
    _id: new mongoose.Types.ObjectId(),
    thumbnail: req.file,
    name: req.body.name,
    flag: req.body.flag,
  });

  visa
    .save()
    .then((visa) => {
      res.status(200).json({
        message: "visa has created",
        visa: visa,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/", checkAuth, (req, res) => {
  Visa.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "all visa's has deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/:visa_id", checkAuth, (req, res) => {
  Visa.findOne({ _id: req.params.visa_id })
    .then((visa) => {
      if (!visa) {
        return res.status(404).json({
          message: "Visa not found",
        });
      }

      // حذف الـ thumbnail
      fs.unlink(visa.thumbnail.path, (err) => {
        if (err) {
          console.error("Error deleting thumbnail:", err);
          return res.status(500).json({
            message: "Error deleting thumbnail",
          });
        }

        // حذف الـ visa بعد حذف الـ thumbnail
        Visa.deleteOne({ _id: req.params.visa_id })
          .then((result) => {
            res.status(200).json({
              message: "Visa has been deleted",
              result: result,
            });
          })
          .catch((err) => {
            res.status(500).json({
              message: err,
            });
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
  } catch (error) {
    if (error.code === "ENOENT") {
      return false; // File does not exist
    } else {
      throw error; // Other error occurred
    }
  }
};

router.patch(
  "/:visa_id",
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
      if (req.body.flag) {
        update.flag = req.body.flag;
      }
      // التحقق مما إذا كان هناك أي شيء للتحديث
      if (Object.keys(update).length === 0) {
        return res.status(400).json({
          message: "Please provide at least one field to update.",
        });
      }
      // التحقق مما إذا كانت الرحلة موجودة قبل محاولة التحديث
      const visas = await Visa.findOne({ _id: req.params.visa_id });
      if (visas.length < 1) {
        return res.status(404).json({
          message: "visa not found.",
        });
      }

      // تحديث الرحلة
      const result = await Visa.updateOne({ _id: req.params.visa_id }, update, {
        upsert: true,
      });

      res.status(200).json({
        message: "visa has been updated.",
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
