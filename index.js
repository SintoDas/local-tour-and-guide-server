const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleWare
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.kjin4dh.mongodb.net/tourDB?retryWrites=true&w=majority`;

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

    const verifyToken = (req, res, next) => {
      const token = req.cookies?.token;
      // console.log("token the middleware", token);
      // no token available
      if (!token) {
        return res.status(401).send({ message: "unauthorized access token" });
      }
      jwt.verify(token, process.env.TOKEN_ACCESS_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.user = decoded;
        next();
      });
      // next()
    };

    // post api for service collection
    app.post("/api/v1/create-service", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // all service
    // filtered services

    app.get("/api/v1/services", async (req, res) => {
      let queryObj = {};
      const providerEmail = req.query.providerEmail;
      if (providerEmail) {
        queryObj.providerEmail = providerEmail;
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
    //update service
    app.put("/api/v1/services/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedService = req.body;
      const service = {
        $set: {
          serviceImage: updatedService.serviceImage,
          serviceName: updatedService.serviceName,
          serviceDescription: updatedService.serviceDescription,
          providerName: updatedService.providerName,
          providerEmail: updatedService.providerEmail,
          servicePrice: updatedService.servicePrice,
          serviceArea: updatedService.serviceArea,
        },
      };
      const result = await serviceCollection.updateOne(
        filter,
        service,
        options
      );
      res.send(result);
    });
    // create booking
    app.post("/api/v1/create-booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // all booking and find my bookings
    app.get("/api/v1/bookings", verifyToken, async (req, res) => {
      console.log("cookie", req.cookies);
      let query = {};
      if (req.query.email) {
        query = { userEmail: req.query.email };
      }
      console.log(req.query.email);
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // delete service id
    app.delete("/api/v1/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    //auth api
    app.post("/api/v1/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, secret, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });
    app.post("/api/v1/logOut", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
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
