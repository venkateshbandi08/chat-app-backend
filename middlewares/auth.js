const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  try {
    let token = req.header("x-token");
    if (!token) {
      return res.status(400).send("Token Not Found!");
    }
    let decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // let payload = {
    //     user: {
    //         id: exist.id
    //     }
    // }
    req.user = decoded.user;
    next();
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error in Auth!");
  }
};
