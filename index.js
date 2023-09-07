const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

// //All  middleware here
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const PaymentCollection = client.db("profitPrimeDB").collection("payment");
    const logosCollection = client
      .db("profitPrimeDB")
      .collection("companyLogos");
    const businessRevenueCollection = client
      .db("profitPrimeDB")
      .collection("businessRevenue");
    const productConsultingCollection = client
      .db("profitPrimeDB")
      .collection("productConsulting");
    const consultingRevenueCollection = client
      .db("profitPrimeDB")
      .collection("consultingRevenue");
    const revenueChartCollection = client
      .db("profitPrimeDB")
      .collection("revenueChart");
    // users API-----------------
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    //aft
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      // console.log(query);
      const result = await usersCollection.findOne(query);
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

    // Get Prime users
    app.get("/users/prime", async (req, res) => {
      const query = { userRole: "Prime" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // Get basic users
    app.get("/users/basic", async (req, res) => {
      const query = { userRole: "Basic" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/update-user", async (req, res) => {
      const { email, userRole } = req.body;

      try {
        // Find the user by email and update their role
        const query = { email };
        const update = { $set: { userRole } };
        const result = await usersCollection.updateOne(query, update);

        if (result.modifiedCount === 1) {
          res.send({ message: "User role updated successfully" });
        } else {
          res
            .status(400)
            .send({ message: "User not found or role not updated" });
        }
      } catch (error) {
        console.error("Error updating user role:", error);
        res
          .status(500)
          .send({ message: "An error occurred while updating user role" });
      }
    });
    app.post("/update-user-info", async (req, res) => {
      const { email, category, contact, website, address } = req.body;

      try {
        // Find the user by email and update their role
        const query = { email };
        const update = { $set: { contact, website, address, category } };
        const result = await usersCollection.updateOne(query, update);

        if (result.modifiedCount === 1) {
          res.send({ message: "User role updated successfully" });
        } else {
          res
            .status(400)
            .send({ message: "User not found or role not updated" });
        }
      } catch (error) {
        console.error("Error updating user role:", error);
        res
          .status(500)
          .send({ message: "An error occurred while updating user role" });
      }
    });
    // BusinessRevenue API
    app.get("/businessRevenue", async (req, res) => {
      const result = await businessRevenueCollection.find().toArray();
      res.send(result);
    });
    // ProductConsulting API
    app.get("/productConsulting", async (req, res) => {
      const result = await productConsultingCollection.find().toArray();
      res.send(result);
    });
    // RevenueChart API
    app.get("/revenueChart", async (req, res) => {
      const result = await revenueChartCollection.find().toArray();
      res.send(result);
    });
    // ConsultingRevenue
    app.get("/consultingRevenue", async (req, res) => {
      const result = await consultingRevenueCollection.find().toArray();
      res.send(result);
    });
    // Reviews API----------------
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    // Company Logo API-----------
    app.get("/companyLogos", async (req, res) => {
      const result = await logosCollection.find().toArray();
      res.send(result);
    });
    // Admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Verify admin by email
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    // Payment Related API
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    //Payment history
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const insertResult = await PaymentCollection.insertOne(payment);
      // console.log(payment);

      res.send(insertResult);
    });

    app.get("/payment-history/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        // console.log(query);
        const payments = await PaymentCollection.find(query).toArray(); // Use find and toArray
        res.json(payments);
      } catch (error) {
        console.error("Error fetching payment records:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

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
