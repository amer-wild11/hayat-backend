const express = require("express");
const router = express.Router();
const News = require("../models/news");
const mongoose = require("mongoose");
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
  News.find()
    .then((news) => {
      res.status(200).json({
        news: news,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.get("/:news_id", (req, res) => {
  News.find({ _id: req.params.news_id })
    .then((news) => {
      res.status(200).json({
        news: news,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.post("/", checkAuth, upload.single("thumbnail"), (req, res) => {
  const news = new News({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    desc: req.body.desc,
    thumbnail: req.file,
  });
  news
    .save()
    .then((news) => {
      res.status(200).json({
        message: "news has created",
        news: news,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/", checkAuth, (req, res) => {
  News.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "news deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/:news_id", checkAuth, (req, res) => {
  News.findOne({ _id: req.params.news_id })
    .then((news) => {
      if (!news) {
        return res.status(404).json({
          message: "News not found",
        });
      }

      fs.unlink(news.image.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return res.status(500).json({
            message: "Error deleting file",
          });
        }
      });

      News.deleteOne({ _id: req.params.news_id })
        .then((result) => {
          res.status(200).json({
            message: "News has been deleted",
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
  } catch (error) {
    if (error.code === "ENOENT") {
      return false; // File does not exist
    } else {
      throw error; // Other error occurred
    }
  }
};

router.patch(
  "/:news_id",
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
      if (req.body.title) {
        update.title = req.body.title;
      }
      // التحقق مما إذا كان هناك بلد معروف وإضافته إلى التحديث
      if (req.body.desc) {
        update.desc = req.body.desc;
      }

      // التحقق مما إذا كان هناك أي شيء للتحديث
      if (Object.keys(update).length === 0) {
        return res.status(400).json({
          message: "Please provide at least one field to update.",
        });
      }

      // التحقق مما إذا كانت الرحلة موجودة قبل محاولة التحديث
      const news = await News.findOne({ _id: req.params.news_id });
      if (!news) {
        return res.status(404).json({
          message: "news not found.",
        });
      }

      // حذف الصورة القديمة إذا كانت موجودة
      if (news.thumbnail && typeof news.thumbnail === "string") {
        fs.unlinkSync(news.thumbnail);
      }

      // تحديث الرحلة
      const result = await News.updateOne({ _id: req.params.news_id }, update, {
        upsert: true,
      });

      res.status(200).json({
        message: "news has been updated.",
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
