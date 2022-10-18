import express from 'express'
import { createServer } from "http";
import bodyParser from 'body-parser'
import cors from 'cors'
import { PrismaClient } from "@prisma/client"
import { Server } from "socket.io";



const prisma = new PrismaClient();

const TOKEN = "abc";

const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("a user connected: " + socket.id);
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});


function bigIntToString(object) {
    for (let key in object) {
        if (typeof object[key] === 'bigint') {
            object[key] = object[key].toString();
        }
    }
    return object;
}



app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get("/post", (req, res) => {
    res.send("Only post requests are allowed");
});

app.post("/post", async(req, res) => {
    const body = req.body;

    var HCHC = null;
    var HCHP = null;
    var BASE = null;
    var PAPP = null;
    var IINST = null;

    if (!("TOKEN" in body))
        return "TOKEN is missing";

    if (body.TOKEN != TOKEN)
        return "TOKEN is invalid";

    if ("HCHC" in body && !isNaN(body.HCHC)) {
        HCHC = body.HCHC;
    }
    if ("HCHP" in body && !isNaN(body.HCHP)) {
        HCHP = body.HCHP;
    }
    if ("BASE" in body && !isNaN(body.BASE)) {
        BASE = body.BASE;
    }
    if ("PAPP" in body && !isNaN(body.PAPP)) {
        PAPP = body.PAPP;
    }
    if ("IINST" in body && !isNaN(body.IINST)) {
        IINST = body.IINST;
    }

    const result = await prisma.conso.create({
        data: {
            HCHC: HCHC,
            HCHP: HCHP,
            BASE: BASE,
            PAPP: PAPP,
            IINST: IINST,
        },
    });

    console.log("Saved in database:");
    console.log(result);
    prisma.$disconnect();
    var toSend = bigIntToString(result);
    io.emit("live", result);
    res.send("OK");
});


app.get('*', function(req, res) {
    //res.redirect('/')
    //404 error
    res.send('404 Not Found', 404);
});

httpServer.listen(3001, () => {
    console.log('Example app listening on port 3001!')
});