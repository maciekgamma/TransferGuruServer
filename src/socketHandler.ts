import socketManager from "./socketManager";
import { eventNames as event } from "./constants";
import { Socket } from "socket.io";

interface SocketHandler {
	newSocket: (Socket) => void;
}

interface AskAvailabilityParams {
	requestedCode: string;
	hostCode: string;
}

interface PeerData {
	type?: "offer" | "pranswer" | "answer" | "rollback";
	sdp?: unknown;
	candidate?: unknown;
}

interface ConnectRequestFromPeerParams {
	requestedCode: string;
	hostCode: string;
	peerData: PeerData;
}

interface ConnectionOfferResponseFromPeerParams {
	requestedCode: string;
	hostCode: string;
	peerData: PeerData;
}

interface ConnectionRequestResponse {
	errors: Array<string>;
	succes: boolean;
	candidatesCode: string;
	peerData?: PeerData;
}

const socketHandler = (): SocketHandler => {
	const sm = socketManager();

	const newSocket = (socket: Socket): void => {
		const code = sm.addSocket(socket);
		socket.emit(event.newCode, code);

		socket.on("disconnect", () => {
			sm.removeSocket(code);
			console.log(`socket ${code} disconnected`);
		});

		socket.on(
			event.askAvailability,
			async ({ requestedCode }: AskAvailabilityParams) => {
				try {
					const res = await sm.askSocketForAvailability(
						requestedCode
					);
					socket.emit(event.availabilityResponse, res);
				} catch (err) {
					console.error(err);
				}
			}
		);

		socket.on(
			event.connectRequestFromPeer,
			(data: ConnectRequestFromPeerParams) => {
				const errors: Array<string> = [];
				const res: ConnectionRequestResponse = {
					errors,
					succes: false,
					candidatesCode: data.requestedCode
				};
				const remoteSocket = sm.getSocketByCode(data.requestedCode);
				if (remoteSocket === undefined) {
					res.errors.push("Connection failed. No socket found!");
					socket.emit(event.connectRequestFromPeer, res);
				} else {
					remoteSocket.emit(event.connectOffer, data);
					console.log("Connection offered!");
				}
			}
		);

		socket.on(
			event.connectionOfferResponseFromPeer,
			(data: ConnectionOfferResponseFromPeerParams) => {
				const errors: Array<string> = [];
				const res: ConnectionRequestResponse = {
					errors,
					succes: true,
					candidatesCode: code
				};

				const remotePeer = sm.getSocketByCode(data.requestedCode);
				if (!remotePeer) {
					const failedResponde: ConnectionRequestResponse = {
						errors: ["Socket not found!"],
						succes: false,
						candidatesCode: data.requestedCode
					};
					socket.emit(
						event.connectionRequestResponse,
						failedResponde
					);
				} else {
					res.peerData = data.peerData;
					remotePeer.emit(event.connectionRequestResponse, res);
				}
			}
		);
		console.log(`socket ${code} connected!`);
	};

	return { newSocket };
};

export default socketHandler;
