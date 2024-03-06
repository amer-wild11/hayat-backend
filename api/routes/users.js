const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Users = require("../models/users");
const bcrypt = require("bcrypt");
const multer = require("multer");
const jwt = require("jsonwebtoken");

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
  Users.find()
    .then((users) => {
      res.status(200).json({
        users: users,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.get("/:user_id", (req, res) => {
  Users.find({ _id: req.params.user_id })
    .then((user) => {
      res.status(200).json({
        user: user,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.post("/signup", upload.single("profile_image"), (req, res) => {
  Users.find({ email: req.body.email }).then((user) => {
    if (user.length < 1) {
      if (req.body.password) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              message: err,
            });
          } else {
            const user = new Users({
              _id: new mongoose.Types.ObjectId(),
              name: req.body.name,
              email: req.body.email,
              password: hash,
              profile_image: req.file
                ? req.file.path
                : "profile_images/1708026587350-logo-9.png",
            });
            user
              .save()
              .then((user) => {
                const token = jwt.sign(
                  { email: user.email, userId: user._id },
                  process.env.JWT_KEY,
                  { expiresIn: "999h" }
                );
                res.status(200).json({
                  message: "user created",
                  user: user,
                  token: token,
                });
              })
              .catch((err) => {
                res.status(500).json({
                  message: err,
                });
              });
          }
        });
      } else {
        return res.status(500).json({
          message: "password is required",
        });
      }
    } else {
      return res.status(500).json({
        message: "email is already exist",
      });
    }
  });
});

router.post("/login", (req, res) => {
  Users.find({ email: req.body.email })
    .then((user) => {
      if (user.length < 1 && req.body.email) {
        return res.status(500).json({
          message: "email is incorrect!",
        });
      } else {
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
          if (err) {
            return res.status(500).json({
              message: err,
            });
          }
          if (result) {
            const token = jwt.sign(
              { email: user[0].email, userId: user[0].id },
              process.env.JWT_KEY,
              { expiresIn: "999h" }
            );
            return res.status(200).json({
              message: "loged in succssfuly",
              user: {
                name: user[0].name,
                email: user[0].email,
                profile_image: user[0].profile_image,
                _id: user[0]._id,
              },
              token: token,
            });
          } else {
            return res.status(404).json({
              message: "password is incorrect",
            });
          }
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: err,
      });
    });
});

router.delete("/", (req, res) => {
  if (!req.body.delete_password) {
    return res.status(500).json({
      message: "delete password is required",
    });
  }
  if (req.body.delete_password == "hayat_delete") {
    Users.deleteMany().then((result) => {
      res.status(200).json({
        message: "users has deleted",
        result: result,
      });
    });
  } else {
    res.status(500).json({
      message: "delete password is incorrect",
    });
  }
});

module.exports = router;
