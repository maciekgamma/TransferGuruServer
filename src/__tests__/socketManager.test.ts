// @ts-nocheck
import socketHandler from "../socketHandler";
import io = require("socket.io-client");
import * as express from "express";
import { Server } from "http";
import { Server as ServerIO } from "socket.io";
import { eventNames as event } from "../constants";

let socket;
let httpServer;
let httpServerAddr;
let ioServer;
let app;
/**
 * Setup WS & HTTP servers
 */
beforeAll(done => {
	app = express();
	httpServer = new Server(app);
	httpServer.listen();
	httpServerAddr = httpServer.address();
	ioServer = new ServerIO(httpServer);
	done();
});

/**
 *  Cleanup WS & HTTP servers
 */
afterAll(done => {
	ioServer.close();
	httpServer.close();
	done();
});

/**
 * Run before each test
 */
beforeEach(done => {
	// Setup
	// Do not hardcode server port and address, square brackets are used for IPv6

	socket = io.connect(
		`http://[${httpServerAddr.address}]:${httpServerAddr.port}`,
		{
			"reconnection delay": 0,
			"reopen delay": 0,
			"force new connection": true,
			transports: ["websocket"]
		}
	);

	socket.on("connect", () => {
		done();
	});
});

/**
 * Run after each test
 */
afterEach(done => {
	// Cleanup
	if (socket.connected) {
		socket.disconnect();
	}
	done();
});

describe("basic socket.io example", () => {
	test("new socket stored in Socket Manager", done => {
		const sh = socketHandler();
		socket.on(event.newCode, code => {
			expect(code).toMatch("/^[0-9A-Z]{6}$/");
			done();
		});
		ioServer.on("connection", mySocket => {
			const code = sh.newSocket(mySocket);
			expect(code).toMatch("/^[0-9A-Z]{6}$/");
		});
	});
});
