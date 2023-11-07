const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
// tourGuide
//QDRMjf4s60LmT3cZ
// database connection
// middleWare
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://tourGuide:QDRMjf4s60LmT3cZ@cluster0.kjin4dh.mongodb.net/tourDB?retryWrites=true&w=majority";

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
    const serviceCollection = client.db("tourDB").collection("services");
    const bookingCollection = client.db("tourDB").collection("booking");
    // all service
    // filtered services

    app.get("/api/v1/services", async (req, res) => {
      let queryObj = {};
      const serviceName = req.query.serviceName;
      if (serviceName) {
        queryObj.serviceName = serviceName;
      }
      const cursor = serviceCollection.find(queryObj);
      const result = await cursor.toArray();
      res.send(result);
    });
    // find single service
    app.get("/api/v1/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // create booking
    app.post("/api/v1/create-booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // all booking and find my bookings
    app.get("/api/v1/bookings", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { userEmail: req.query.email };
      }
      console.log(req.query.email);
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
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
  res.send("LOCAL TOURS AND GUIDE SERVER IS RUNNING");
});

app.listen(port, () => {
  console.log(`Local tours and guide listening on port ${port}`);
});
