const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

//stripe
//aft
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);

// //All  middleware here
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hbpicg2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    // All Collections
    const usersCollection = client.db("profitPrimeDB").collection("users");
    const reviewsCollection = client.db("profitPrimeDB").collection("reviews");
    const logosCollection = client
      .db("profitPrimeDB")
      .collection("companyLogos");
    // users API
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    //user update (aft)
    app.post('/update-user', async (req, res) => {
      const { email, userRole } = req.body;

      try {
        // Find the user by email and update their role
        const query = { email };
        const update = { $set: { userRole } };
        const result = await usersCollection.updateOne(query, update);

        if (result.modifiedCount === 1) {
          res.send({ message: 'User role updated successfully' });
        } else {
          res.status(400).send({ message: 'User not found or role not updated' });
        }
      } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).send({ message: 'An error occurred while updating user role' });
      }
    });


    // Reviews API
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    // Company Logo API
    app.get("/companyLogos", async (req, res) => {
      const result = await logosCollection.find().toArray();
      res.send(result);
    });


    // Payment Related API(aft)
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ProfitPrime Master is Running");
});
app.listen(port, () => {
  console.log(`ProfitPrime is running on port ${port}`);
});

// ---------
// pass: X7tAtTDxYbp6Baca
// profit-prime
