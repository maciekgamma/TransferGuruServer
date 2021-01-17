require("dotenv").config();
import * as express from "express";
import * as rateLimit from "express-rate-limit";
import { Server } from "http";
import { Server as ServerIO } from "socket.io";
import socketHandler from "./socketHandler";

const app = express();

const limiter = rateLimit({
	windowsMs: 60 * 1000,
	max: 100
});
app.use(limiter);

const http = new Server(app);

const io = new ServerIO(http, {
	cors: {
		origin: "*"
	}
});

const sh = socketHandler();

io.on("connection", sh.newSocket);

http.listen(process.env.PORT, () =>
	console.log(`app listening on port ${process.env.PORT}!`)
);
