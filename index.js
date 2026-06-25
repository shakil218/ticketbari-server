const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.get("/", (req, res) => {
  console.log("backend server hit");
  res.send("Hello World!");
});
app.get("/test-server", (req, res) => {
  console.log("TEST SERVER HIT");
  res.send("Backend Working");
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
    const ticketCollection = database.collection("tickets");
    const bookingCollection = database.collection("bookings");
    const paymentCollection = database.collection("payments");

    // Users Related API
    app.get("/api/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // update user image
    app.patch("/api/users/image/:email", async (req, res) => {
      const email = req.params.email;
      const { image } = req.body;

      const result = await userCollection.updateOne(
        { email },
        {
          $set: {
            image,
            updatedAt: new Date(),
          },
        },
      );

      res.send(result);
    });

    // update user role and fraud status
    app.patch("/api/users/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const { role, isFraud } = req.body;

        const user = await userCollection.findOne({
          email,
        });

        if (!user) {
          return res.status(404).send({
            message: "User not found",
          });
        }

        const updateDoc = {};

        if (role) {
          updateDoc.role = role;
        }

        if (typeof isFraud === "boolean") {
          updateDoc.isFraud = isFraud;

          // Hide vendor tickets when marked fraud
          if (isFraud) {
            await ticketCollection.updateMany(
              {
                vendorEmail: email,
              },
              {
                $set: {
                  isHidden: true,
                },
              },
            );
          }

          // Show tickets again if fraud removed
          if (!isFraud) {
            await ticketCollection.updateMany(
              {
                vendorEmail: email,
              },
              {
                $set: {
                  isHidden: false,
                },
              },
            );
          }
        }

        const result = await userCollection.updateOne(
          { email },
          {
            $set: updateDoc,
          },
        );
        res.send(result);
      } catch (error) {
        console.error(error);

        res.status(500).send({
          message: "Failed to update user",
        });
      }
    });

    // Tickets Related API
    app.get("/api/tickets", async (req, res) => {
      const query = {};
      if (req.query.vendorEmail) {
        query.email = req.query.vendorEmail;
      }
      const result = await ticketCollection.find(query).toArray();
      res.send(result);
    });

    // get admin approved tickets
    app.get("/api/tickets/approved", async (req, res) => {
      try {
        const result = await ticketCollection
          .find({
            status: "approved",
            isHidden: { $ne: true },
          })
          .sort({
            updatedAt: -1,
          })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: error.message,
        });
      }
    });

    app.get("/api/tickets/:id", async (req, res) => {
      const id = req.params.id;
      const result = await ticketCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/api/tickets", async (req, res) => {
      const ticket = req.body;
      const result = await ticketCollection.insertOne(ticket);
      res.send(result);
    });

    app.patch("/api/tickets/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      const result = await ticketCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        },
      );

      res.send(result);
    });

    // update advertised status
    app.patch("/api/tickets/advertise/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { isAdvertised } = req.body;

        if (isAdvertised) {
          const count = await ticketCollection.countDocuments({
            isAdvertised: true,
          });

          if (count >= 6) {
            return res.status(400).send({
              message: "Only 6 advertisements are allowed.",
            });
          }
        }

        const result = await ticketCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              isAdvertised,
              updatedAt: new Date(),
            },
          },
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: error.message,
        });
      }
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
      };
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
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // payment related api
    app.get("/api/payments", async (req, res) => {
      const query = {};
      if (req.query.customerEmail) {
        query.customerEmail = req.query.customerEmail;
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/api/payments", async (req, res) => {
      try {
        const payment = req.body;

        const booking = await bookingCollection.findOne({
          _id: new ObjectId(payment.bookingId),
        });

        if (!booking) {
          return res.status(404).send({
            success: false,
            message: "Booking not found",
          });
        }

        // Prevent duplicate payment processing
        if (booking.status === "paid") {
          return res.send({
            success: true,
            message: "Already processed",
          });
        }

        // Save payment history
        const paymentInfo = {
          ...payment,
          paymentStatus: "paid",
          createdAt: new Date(),
        };

        await paymentCollection.insertOne(paymentInfo);

        // Update booking status
        await bookingCollection.updateOne(
          {
            _id: new ObjectId(payment.bookingId),
          },
          {
            $set: {
              status: "paid",
              paidAt: new Date(),
              transactionId: payment.transactionId,
            },
          },
        );

        // Reduce ticket quantity
        await ticketCollection.updateOne(
          {
            _id: new ObjectId(payment.ticketId),
          },
          {
            $inc: {
              quantity: -Number(payment.bookingQuantity),
            },
          },
        );

        res.send({
          success: true,
          message: "Payment processed successfully",
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
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
