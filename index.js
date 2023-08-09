const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// //All  middleware here
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("ProfitPrime Master is Running");
});
app.listen(port, () => {
  console.log(`ProfitPrime is running on port ${port}`);
});
