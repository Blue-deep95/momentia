const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async (app) => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("DB connected");


  } catch (err) {
    console.log("error while connecting db", err);
    process.exit(1);
  }
};

module.exports = connectDB;
