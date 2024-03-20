const http = require("http");
const app = require("./app.js");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "https://hayat.iq"],
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  },
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`server running at port ${port}`);
});

const Travels = require("./api/models/travels.js");
const changeStream = Travels.watch();
const Offers = require("./api/models/offers.js");
const changeOffersStream = Offers.watch();

changeStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postTravel", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("travelDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    Travels.findOne({ _id: change.documentKey._id }).then((travel) => {
      io.emit("travelUpdated", travel);
    });
  }
});

changeOffersStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postOffer", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("offerDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    Offers.findOne({ _id: change.documentKey._id }).then((offer) => {
      io.emit("offerUpdated", offer);
    });
  }
});

const News = require("./api/models/news.js");

const newsChangeStream = News.watch();

newsChangeStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postNews", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("newsDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    News.findOne({ _id: change.documentKey._id }).then((news) => {
      io.emit("newsUpdated", news);
    });
  }
});

const Services = require("./api/models/services.js");
const servChangeStream = Services.watch();

servChangeStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postServ", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("servDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    Services.findOne({ _id: change.documentKey._id }).then((serv) => {
      io.emit("servUpdated", serv);
    });
  }
});

const Hotels = require("./api/models/hotels.js");
const hotelsChangeStream = Hotels.watch();

hotelsChangeStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postHotel", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("hotelDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    Hotels.findOne({ _id: change.documentKey._id }).then((hotel) => {
      io.emit("hotelUpdated", hotel);
    });
  }
});
const Resorts = require("./api/models/resorts.js");
const resortsChangeStream = Resorts.watch();

resortsChangeStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postResort", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("resortDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    Resorts.findOne({ _id: change.documentKey._id }).then((resort) => {
      io.emit("resortUpdated", resort);
    });
  }
});

const Dests = require("./api/models/destinations.js");
const destsChangeStream = Dests.watch();

destsChangeStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postDest", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("destDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    Dests.findOne({ _id: change.documentKey._id }).then((dest) => {
      io.emit("destUpdated", dest);
    });
  }
});

const Trips = require("./api/models/trips.js");
const TripsChangeStream = Trips.watch();

TripsChangeStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postTrip", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("tripDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    Trips.findOne({ _id: change.documentKey._id }).then((trip) => {
      io.emit("tripUpdated", trip);
    });
  }
});

const Visa = require("./api/models/visa.js");
const VisaChangeStream = Visa.watch();

VisaChangeStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postVisa", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("visaDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    Visa.findOne({ _id: change.documentKey._id }).then((visa) => {
      io.emit("visaUpdated", visa);
    });
  }
});

const Tickets = require("./api/models/tickets.js");
const TicketsChangeStream = Tickets.watch();

TicketsChangeStream.on("change", (change) => {
  if (change.operationType == "insert") {
    io.emit("postTicket", change.fullDocument);
  }
  if (change.operationType == "delete") {
    io.emit("ticketDeleted", change.documentKey._id);
  }
  if (change.operationType == "update") {
    Tickets.findOne({ _id: change.documentKey._id }).then((ticket) => {
      io.emit("ticketUpdated", ticket);
    });
  }
});

io.on("connection", (socket) => {
  console.log(socket.id);
});
