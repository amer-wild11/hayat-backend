const express = require("express");
const router = express.Router();
const Tickets = require("../models/tickets");
const checkAuth = require("../midleware/checkAuth");
const multer = require("multer");

const fs = require("fs");
const { default: mongoose } = require("mongoose");

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
  Tickets.find()
    .then((tickets) => {
      res.status(200).json({
        tickets: tickets,
      });
    })
    .catch((err) => {
      res.status(500).json({
        Error: err,
      });
    });
});

router.get("/:ticket_id", (req, res) => {
  Tickets.findOne({ _id: req.params.ticket_id })
    .then((ticket) => {
      res.status(200).json({
        ticket: ticket,
      });
    })
    .catch((err) => {
      res.status(500).json({
        Error: err,
      });
    });
});

router.post("/", checkAuth, upload.single("ticket"), (req, res) => {
  if (!req.file) {
    return res.status(500).json({
      message: "ticket is required",
    });
  }
  const ticket = new Tickets({
    _id: new mongoose.Types.ObjectId(),
    ticket: req.file,
    name: req.body.name,
  });
  ticket
    .save()
    .then((ticket) => {
      res.status(200).json({
        message: "ticket has created",
        ticket: ticket,
      });
    })
    .catch((err) => {
      res.status(500).json({
        Error: err,
      });
    });
});

router.delete("/", checkAuth, (req, res) => {
  Tickets.deleteMany()
    .then((result) => {
      res.status(200).json({
        message: "all tickets has delted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        Error: err,
      });
    });
});

router.delete("/:ticket_id", checkAuth, (req, res) => {
  Tickets.findOne({ _id: req.params.ticket_id })
    .then((ticket) => {
      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }

      // حذف الـ ticket
      fs.unlink(ticket.ticket.path, (err) => {
        if (err) {
          console.error("Error deleting ticket:", err);
          return res.status(500).json({
            message: "Error deleting ticket",
          });
        }

        // حذف الـ ticket بعد حذف الـ ticket
        Tickets.deleteOne({ _id: req.params.ticket_id })
          .then((result) => {
            res.status(200).json({
              message: "Ticket has been deleted",
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

router.patch(
  "/:ticket_id",
  checkAuth,
  upload.single("ticket"),
  async (req, res) => {
    try {
      const update = {};

      // Check if there is a file and add it to the update
      if (req.file) {
        update.ticket = req.file;
      }
      // Check if there is a name provided and add it to the update
      if (req.body.name) {
        update.name = req.body.name;
      }
      if (Object.keys(update).length === 0) {
        return res.status(400).json({
          message: "Please provide at least one field to update.",
        });
      }

      const ticket = await Tickets.findOne({ _id: req.params.ticket_id });
      if (!ticket) {
        return res.status(404).json({
          message: "ticket not found.",
        });
      }

      // Update the trip
      const result = await Tickets.updateOne(
        { _id: req.params.ticket_id },
        update,
        {
          upsert: true,
        }
      );

      res.status(200).json({
        message: "ticket has been updated.",
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
