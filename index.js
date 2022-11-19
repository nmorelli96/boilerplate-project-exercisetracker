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

let usernameSchema = new mongoose.Schema({
  username: {type: String, required: true,},
});

let exerciseSchema = new.mongoose.Schema({
  username: {type: String, required: true,},
  description: String,
  duration: Number,
  date: Date,
  _id: "5fb5853f734231456ccb3b05"
})

const username = mongoose.model("username", usernameSchema, "username");
const exercise = mongoose.model("exercise", exerciseSchema, "exercise")

let responseJSON = {};

app.post(
  "/api/users",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let input = req.body["username"]; // the url name comes from index.html input object name
    responseJSON["username"] = input;

    username.findOne({ username: input }, (err, query) => {
      if (err) {
        return console.log(err);
      }
      if (!err && query) {
        // if the website we're adding already exists in db, just return the existing json values
        console.log(query.username);
        console.log(query._id);
        responseJSON["username"] = query.username;
        responseJSON["_id"] = query._id;
        return res.json(responseJSON);
      } else {
        // if not, create new values
        username.findOneAndUpdate(
          { username: input },
          { username: input },
          { new: true, upsert: true },
          (err, usernameUpdated) => {
            if (err) {
              return console.error(err);
            } else {
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
    let input = req.body["username"]; // the url name comes from index.html input object name
    responseJSON["username"] = input;

    username.findOne({ username: input }, (err, query) => {
      if (err) {
        return console.log(err);
      }
      if (!err && query) {
        // if the website we're adding already exists in db, just return the existing json values
        console.log(query.username);
        console.log(query._id);
        responseJSON["username"] = query.username;
        responseJSON["_id"] = query._id;
        return res.json(responseJSON);
      } else {
        // if not, create new values
        username.findOneAndUpdate(
          { username: input },
          { username: input },
          { new: true, upsert: true },
          (err, usernameUpdated) => {
            if (err) {
              return console.error(err);
            } else {
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

app.get("/api/users/:id/logs", (req, res) => {
  let id = req.params.id;
  username.findById(id, (err, query) => {
    if (err) {
      return console.log(err);
    }
    if (!err && query) {
      console.log(query);
      responseJSON["username"] = query.username;
      responseJSON["_id"] = query._id;
      return res.json(responseJSON);
    }
    if (!err && !query) {
      res.send("not found");
    }
  });
});
