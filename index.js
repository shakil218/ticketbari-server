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
    const sessionCollection = database.collection("session");
    const ticketCollection = database.collection("tickets");
    const bookingCollection = database.collection("bookings");
    const paymentCollection = database.collection("payments");

    // Verification Related Custom Middleware
    const verifyToken = async (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({
          message: "Unauthorized Access",
        });
      }

      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(401).send({
          message: "Unauthorized Access",
        });
      }

      const query = { token: token };
      const session = await sessionCollection.findOne(query);
      const userId = session?.userId;
      const userQuery = { _id: userId };
      const user = await userCollection.findOne(userQuery);

      req.user = user;
      next();
    };
    

    // Users Related API
    app.get("/api/users", verifyToken, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // update user image
    app.patch("/api/users/image/:email", verifyToken, async (req, res) => {
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
    app.patch("/api/users/:email", verifyToken, async (req, res) => {
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
    app.get("/api/tickets", verifyToken, async (req, res) => {
      const query = {
        isHidden: { $ne: true },
      };

      if (req.query.vendorEmail) {
        query.vendorEmail = req.query.vendorEmail;
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

    app.post("/api/tickets", verifyToken, async (req, res) => {
      const ticket = req.body;
      const result = await ticketCollection.insertOne(ticket);
      res.send(result);
    });

    app.patch("/api/tickets/:id", verifyToken, async (req, res) => {
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
    app.patch("/api/tickets/advertise/:id", verifyToken, async (req, res) => {
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

    // Update Ticket with vendor
    app.patch("/api/tickets/update/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;

        const updatedTicket = req.body;

        const result = await ticketCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              ...updatedTicket,
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

    app.delete("/api/tickets/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;

        const result = await ticketCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: error.message,
        });
      }
    });

    // Tickets Booking related API
    app.get("/api/bookings", verifyToken, async (req, res) => {
      const query = {};
      if (req.query.passengerId) {
        query.passengerId = req.query.passengerId;
      }

      if (req.query.vendorEmail) {
        query.vendorEmail = req.query.vendorEmail;
      }

      if (req.query.ticketId) {
        query.ticketId = req.query.ticketId;
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/api/bookings", verifyToken, async (req, res) => {
      const booking = req.body;
      const newBooking = {
        ...booking,
        createdAt: new Date(),
      };
      const result = await bookingCollection.insertOne(newBooking);
      res.send(result);
    });

    app.patch("/api/bookings/:id", verifyToken, async (req, res) => {
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
    app.get("/api/payments", verifyToken, async (req, res) => {
      const query = {};
      if (req.query.customerEmail) {
        query.customerEmail = req.query.customerEmail;
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/api/payments", verifyToken, async (req, res) => {
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

    // revenue report
    app.get("/api/vendor-analytics/:email", verifyToken, async (req, res) => {
      try {
        const { email } = req.params;

        // 1. Fetch all tickets owned by this vendor
        const tickets = await ticketCollection
          .find({ vendorEmail: email })
          .toArray();

        // 2. Fetch all bookings for this vendor's tickets that have been paid
        // We match by checking if the booking has a status of "paid"
        // Note: If your schema uses passengerEmail/vendorEmail mappings explicitly, adjust filter criteria
        const bookings = await bookingCollection
          .find({
            status: "paid",
          })
          .toArray();

        // Since bookings don't explicitly hold a vendorEmail field in the sample,
        // we filter bookings matching this vendor's ticket IDs to be mathematically accurate.
        const vendorTicketIds = tickets.map((t) => t._id.toString());
        const vendorBookings = bookings.filter((b) =>
          vendorTicketIds.includes(b.ticketId),
        );

        // Calculate core totals
        const totalTicketsAdded = tickets.reduce(
          (acc, t) => acc + (Number(t.quantity) || 0),
          0,
        );
        const totalTicketsSold = vendorBookings.reduce(
          (acc, b) => acc + (Number(b.bookingQuantity) || 0),
          0,
        );
        const totalRevenue = vendorBookings.reduce(
          (acc, b) => acc + (Number(b.totalPrice) || 0),
          0,
        );

        /* ---------------- DYNAMIC ROLLING 6-MONTH REVENUE MAP ---------------- */
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const revenueMap = {};

        // Pre-populate structural keys for the last 6 months in chronological order
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const mName = monthNames[d.getMonth()];
          revenueMap[mName] = 0;
        }

        // Allocate booking price groups into matching month structures
        vendorBookings.forEach((booking) => {
          if (booking.paidAt || booking.createdAt) {
            const targetDate = booking.paidAt
              ? new Date(booking.paidAt)
              : new Date(booking.createdAt);
            const mName = monthNames[targetDate.getMonth()];
            if (revenueMap[mName] !== undefined) {
              revenueMap[mName] += Number(booking.totalPrice) || 0;
            }
          }
        });

        const revenueData = Object.entries(revenueMap).map(
          ([month, revenue]) => ({
            month,
            revenue,
          }),
        );

        const ticketPerformance = [
          { name: "Available Pool", value: totalTicketsAdded },
          { name: "Tickets Sold", value: totalTicketsSold },
        ];

        res.send({
          success: true,
          stats: {
            ticketsAdded: totalTicketsAdded,
            ticketsSold: totalTicketsSold,
            revenue: totalRevenue,
          },
          revenueData,
          ticketPerformance,
        });
      } catch (error) {
        console.error("Analytics aggregation error:", error);
        res.status(500).send({
          success: false,
          message:
            "Internal server error gathering aggregate dashboard trends.",
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
