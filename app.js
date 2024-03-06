const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");

app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/uploads", express.static("uploads"));

mongoose
  .connect(
    `mongodb+srv://Hayat-amer:${
      process.env.MONG_PW || "plmoknijb111"
    }@hayat.vkcuzxf.mongodb.net/?retryWrites=true&w=majority`
  )
  .then((result) => {
    console.log("database conected succssfuly ");
  })
  .catch((err) => {
    console.log("database error", err);
  });

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

//routes imports
const usersRoute = require("./api/routes/users");
const travelsRoute = require("./api/routes/travels");
const offersRoute = require("./api/routes/offers");
const newsRoute = require("./api/routes/news");
const servicesRoute = require("./api/routes/services");
const hotelsRoute = require("./api/routes/hotels");
const resortsRoute = require("./api/routes/resorts");
const tripsRoute = require("./api/routes/trips");
const destRoute = require("./api/routes/destinations");
const visaRoute = require("./api/routes/visa");
const ticketRoute = require("./api/routes/tickets");

// user routes in the app
app.use("/users", usersRoute);
app.use("/travels", travelsRoute);
app.use("/offers", offersRoute);
app.use("/news", newsRoute);
app.use("/services", servicesRoute);
app.use("/hotels", hotelsRoute);
app.use("/resorts", resortsRoute);
app.use("/trips", tripsRoute);
app.use("/destinations", destRoute);
app.use("/visa", visaRoute);
app.use("/tickets", ticketRoute);

//handle errors in requests
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    Error: {
      message: error.message,
    },
  });
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

module.exports = app;
