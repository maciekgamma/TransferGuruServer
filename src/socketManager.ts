import generateCode from "./codeGenerator";
import { Socket } from "socket.io";
import { eventNames as event } from "./constants";

interface SocketManagerInterface {
	addSocket: (Socket) => string;
	askSocketForAvailability: (string) => Promise<AskSocketForAvailability>;
	getSocketByCode: (string) => Socket | undefined;
	removeSocket: (string) => boolean;
}

interface AskSocketForAvailability {
	availability: boolean;
	errors: Array<string>;
}

const socketManager = (): SocketManagerInterface => {
	const socketList = new Object();

	const addSocket = (socket: Socket): string => {
		let newCode: string;
		do {
			newCode = generateCode();
		} while (socketList.hasOwnProperty(newCode));

		socketList[newCode] = socket;
		return newCode;
	};

	const getSocketByCode = (code: string): Socket | undefined => {
		if (!socketList.hasOwnProperty(code)) {
			return undefined;
		}
		return socketList[code];
	};

	const removeSocket = (code: string): boolean => {
		if (!socketList.hasOwnProperty(code)) return false;
		delete socketList[code];
		return true;
	};

	const askSocketForAvailability = async (
		code: string
	): Promise<AskSocketForAvailability> => {
		const errors: Array<string> = [];
		const availability = false;
		const response = { errors, availability };

		const socket = getSocketByCode(code);
		if (socket == undefined) {
			response.errors.push("Socket not found!");
			return response;
		}

		const promise = new Promise<AskSocketForAvailability>(
			(resolve, reject) => {
				socket.emit(event.askPeerForAvailability);
				setTimeout(reject, 5000); // wait 5 seconds for respone from remote peer
				socket.on(event.availabilityResponseFromPeer, res => {
					response.availability = res == true;
					resolve(response);
				});
			}
		);
		return promise;
	};

	const sm = {
		addSocket,
		askSocketForAvailability,
		getSocketByCode,
		removeSocket
	};
	return sm;
};

export default socketManager;
