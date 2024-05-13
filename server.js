const express = require("express");
const app = express();
const mongoose = require("mongoose");
const RegisterUser = require("./models/userDetails");
const MessagesModel = require("./models/messageModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const middleware = require("./middlewares/auth");
const cors = require("cors");
const messageModel = require("./models/messageModel");
require("dotenv").config();

const port = process.env.PORT;

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB Connected");
  } catch (err) {
    console.log(`Error connecting to database: ${err}`);
  }
};
connectToMongoDB();

app.use(express.json());
app.use(cors({ origin: "*" }));

// register
app.post("/register", async (req, res) => {
  try {
    const { userName, email, password, confirmPassword } = req.body;
    let exist = await RegisterUser.findOne({ email });
    // if user exists already
    if (exist) {
      return res.send("User Already Exists!");
    }
    // if password not matched
    if (password !== confirmPassword) {
      return res.send("Password not matched with confirmPassword!");
    }
    // else we can add user

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    let newUser = new RegisterUser({
      userName,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    return res.status(200).send("User Registered Successfully!");
  } catch (err) {
    console.log(err);
    return res.status(500).send(`Error in Registering ${err}`);
  }
});

// login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let exist = await RegisterUser.findOne({ email });
    // if not exists in DB
    if (!exist) {
      return res.status(400).send("User Not Found!");
    }
    // compare passwords
    bcrypt.compare(password, exist.password, (err, result) => {
      if (err) {
        return res.send("Invalid password!");
      }
      if (!result) {
        return res.status(400).send("Invalid password!");
      }
      // else we can login
      let payload = {
        user: {
          id: exist.id,
        },
      };
      const key = process.env.JWT_SECRET_KEY;
      jwt.sign(payload, key, { expiresIn: "1hrs" }, (err, token) => {
        if (err) {
          throw err;
        }
        return res.json({ token });
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send(`Error in Login ${err}`);
  }
});

// myprofile (for checking protected route)
app.get("/myprofile", middleware, async (req, res) => {
  try {
    let exist = await RegisterUser.findById(req.user.id);
    if (!exist) {
      return res.status(400).send("User not found");
    }
    return res.json(exist);
  } catch (err) {
    console.log(err);
    return res.status(400).send("server error!");
  }
});

// allprofiles
app.get("/allprofiles", async (req, res) => {
  try {
    let allProfiles = await RegisterUser.find();
    return res.json(allProfiles);
  } catch (err) {
    console.log(err);
    return res.status(400).send("server error");
  }
});

// add message
app.post("/addmessage", middleware, async (req, res) => {
  try {
    const { text } = req.body;
    const exist = await RegisterUser.findById(req.user.id);
    let newMessage = new MessagesModel({
      user: req.user.id,
      userName: exist.userName,
      text,
    });
    await newMessage.save();
    let allMessages = await MessagesModel.find();
    return res.json(allMessages);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error in adding message!");
  }
});

// get all messages
app.get("/allmessages", middleware, async (req, res) => {
  try {
    const allMessages = await MessagesModel.find();
    return res.json(allMessages);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error in getting messages !");
  }
});

// edit/put message
app.put("/allmessages/edit/:id", middleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const editedMessage = await messageModel.findByIdAndUpdate(
      id,
      { text },
      { new: true }
    );
    return res.json(editedMessage);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error in Editing message");
  }
});

// delete message
app.delete("/allmessages/delete/:id", middleware, async (req, res) => {
  try {
    const { id } = req.params;
    await messageModel.findByIdAndDelete(id);
    return res.json("message deleted successfully");
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error in deleting message");
  }
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
