const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const mySecret = process.env["MONGO_URI"];

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

const connection = mongoose.connection;
connection.once("open", function () {
  console.log("Connection with MongoDB was successful");
});

let exerciseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    duration: Number,
    date: String,
  },
  { _id: false, versionKey: false }
);

let usernameSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    count: Number,
    log: [exerciseSchema],
  },
  { versionKey: false }
);

const User = mongoose.model("User", usernameSchema, "users");
const Exercise = mongoose.model("Exercise", exerciseSchema, "exercises");

let responseJSON = {};

app.post(
  "/api/users",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let input = req.body["username"]; // the url name comes from index.html input object name
    responseJSON["username"] = input;

    User.findOne({ username: input }, (err, query) => {
      if (err) {
        return console.log(err);
      }
      if (!err && query) {
        // if the website we're adding already exists in db, just return the existing json values
        console.log(query.username);
        console.log(query._id);
        return res.json({ username: query.username, _id: query._id });
      } else {
        // if not, create new values
        User.findOneAndUpdate(
          { username: input },
          { username: input },
          { new: true, upsert: true },
          (err, usernameUpdated) => {
            if (err) {
              return console.error(err);
            } else {
              responseJSON = {};
              responseJSON["username"] = usernameUpdated.username;
              responseJSON["_id"] = usernameUpdated._id;
              res.json(responseJSON);
            }
          }
        );
      }
    });
  }
);

app.post(
  "/api/users/:_id/exercises",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let id = req.params._id;
    let { description, duration, date } = req.body;

    console.log(`${id}, ${date}, ${duration}, ${description}`);

    let durationRegex = /\d+/g;
    let dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!duration.match(durationRegex)) {
      res.send("Invalid duration");
      return;
    }

    const formattedDate = !date ? new Date() : new Date(date);

    responseJSON["description"] = description;
    responseJSON["duration"] = parseInt(duration);

    User.findById(id, (err, query) => {
      if (err) {
        return console.log(err);
      }
      if (!err && !query) {
        res.send("not found");
      }
      if (!err && query) {
        let log = query.log;
        log.push({
          description: description,
          duration: parseInt(duration),
          date: formattedDate,
        });
        console.log(log);
        User.findOneAndUpdate({ _id: id }, { log: log }, (err, query) => {
          if (err) {
            return console.log(err);
          }
          if (!err && query) {
            // if the website we're adding already exists in db, just return the existing json values
            console.log(query.username);
            console.log(query._id);
            responseJSON["username"] = query.username;
            responseJSON["_id"] = query._id;
            return res.json({
              _id: query._id,
              username: query.username,
              date: formattedDate.toDateString(),
              duration: parseInt(duration),
              description: description,
            });
          } else {
            res.send("Id not found");
          }
        });
      }
    });
  }
);

app.get("/api/users", (req, res) => {
  User.find({}, { _id: 1, username: 1 }, (err, query) => {
    if (err) {
      return console.log(err);
    }
    if (!err && query) {
      res.send(query);
    }
    if (!err && !query) {
      res.send("not found");
    }
  });
});

app.get("/api/users/:id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  let id = req.params.id;
  User.findById(id, (err, query) => {
    if (err) {
      return console.log(err);
    }
    if (!err && query) {
      let filteredLog = [];

      if (from && !to) {
        let fromDate = Date.parse(from); //greater than or equal to
        filteredLog = query.log.filter((exercise) => {
          return Date.parse(exercise.date) > fromDate;
        });
      }

      if (to && !from) {
        let toDate = Date.parse(to);
        filteredLog = query.log.filter((exercise) => {
          return Date.parse(exercise.date) < toDate;
        });
      }

      if (from && to) {
        let fromDate = Date.parse(from);
        let toDate = Date.parse(to);
        filteredLog = query.log.filter((exercise) => {
          return (
            Date.parse(exercise.date) > fromDate &&
            Date.parse(exercise.date) < toDate
          );
        });
      }

      console.log(req.query);

      let nonNullLimit = limit !== null && limit !== undefined ? limit : 500;

      if (!from && !to) {
        filteredLog = query.log;
      }

      if (limit) {
        filteredLog = filteredLog.slice(0, limit);
      }

      //console.log(filteredLog);
      //console.log(query);
      //console.log(logLength);
      for (let i = 0; i < filteredLog.length; i++) {
        filteredLog[i].date = new Date(
          Date.parse(filteredLog[i].date)
        ).toDateString();
      }
      res.send({
        _id: query._id,
        username: query.username,
        count: filteredLog.length,
        log: filteredLog,
      });
      // console.log(query.log);
    }
    if (!err && !query) {
      res.send("not found");
    }
  });
});

/*
app.get("/api/users/:id/log", (req, res) => {
  const { from, to, limit } = req.query;
  let id = req.params.id;
  User.findById(id, (err, query) => {
    if (err) {
      return console.log(err);
    }
    if (!err && query) {
      let dateObj = {};
      if (from) {
        dateObj["$gte"] = new Date(from); //greater than or equal to
      }
      if (to) {
        dateObj["$lte"] = new Date(to);
      }
      let filter = {
        _id: id,
      };
      if (from || to) {
        filter.date = dateObj;
      }
      let nonNullLimit = limit !== null && limit !== undefined ? limit : 500;
      //console.log(query);

      User.find(filter)
        .limit(nonNullLimit)
        .exec((err, data) => {
          if (err) {
            res.send(err);
          } else {
            console.log(filter);
            console.log(nonNullLimit);
            res.send(data);
          }
        });
    }
  });
});
*/
