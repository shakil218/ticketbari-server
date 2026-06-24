const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = process.env.MONGO_DB_URI;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db(process.env.DB_NAME);
    const userCollection = database.collection("user");
    const ticketsCollection = database.collection("tickets");
    const bookingCollection = database.collection("bookings");

    // User Related API
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // Tickets Related API
    app.get("/api/tickets", async (req, res) => {
      const query = {};
      if (req.query.vendorEmail) {
        query.email = req.query.vendorEmail;
      }
      const result = await ticketsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/api/tickets/:id", async (req, res) => {
      const id = req.params.id;
      const result = await ticketsCollection.findOne( { _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/api/tickets", async (req, res) => {
      const ticket = req.body;
      const result = await ticketsCollection.insertOne(ticket);
      res.send(result);
    });

    // Tickets Booking related API
    app.get("/api/bookings", async (req, res) => {
      const query = {};
      if (req.query.passengerId) {
        query.passengerId = req.query.passengerId;
      }
      if (req.query.ticketId) {
        query.ticketId = req.query.ticketId;
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    }); 
    
    app.post("/api/bookings", async (req, res) => {
      const booking = req.body;
      const newBooking = {
        ...booking,
        createdAt: new Date(),
      }
      const result = await bookingCollection.insertOne(newBooking);
      res.send(result);
    });

    app.patch("/api/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const booking = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: booking.status,
        }
      }
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
