const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const Services = require("../models/services");
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
  Services.find()
    .then((services) => {
      res.status(200).json({
        services: services,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.get("/:services_id", (req, res) => {
  Services.find({ _id: req.params.services_id })
    .then((service) => {
      res.status(200).json({
        service: service,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.post("/", checkAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(500).json({
      message: "service image is required",
    });
  } else {
    const service = new Services({
      _id: new mongoose.Types.ObjectId(),
      title: req.body.title,
      desc: req.body.desc,
      image: req.file,
    });
    service
      .save()
      .then((service) => {
        res.status(200).json({
          message: "service has created",
          service: service,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err,
        });
      });
  }
});

router.delete("/", checkAuth, (req, res) => {
  Services.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "services has deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/:service_id", checkAuth, (req, res) => {
  Services.findOne({ _id: req.params.service_id })
    .then((service) => {
      if (!service) {
        return res.status(404).json({
          message: "Service not found",
        });
      }

      fs.unlink(service.image.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return res.status(500).json({
            message: "Error deleting image",
          });
        }

        Services.deleteOne({ _id: req.params.service_id })
          .then((result) => {
            res.status(200).json({
              message: "Service has been deleted",
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
  "/:service_id",
  checkAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const update = {};

      if (req.file) {
        update.image = req.file;
      }
      if (req.body.title) {
        update.title = req.body.title;
      }
      if (req.body.desc) {
        update.desc = req.body.desc;
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).json({
          message: "Please provide at least one field to update.",
        });
      }

      const service = await Services.findOne({ _id: req.params.service_id });
      if (!service) {
        return res.status(404).json({
          message: "news not found.",
        });
      }

      if (service.image && typeof service.image === "string") {
        fs.unlinkSync(service.image);
      }

      const result = await Services.updateOne(
        { _id: req.params.service_id },
        update,
        {
          upsert: true,
        }
      );

      res.status(200).json({
        message: "service has been updated.",
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
