const generateCode = (length = 6): string => {
	let code = "";
	const allChars = "ABCDEFGHJKLMNPRSTUVWXYZ123456789";
	for (let i = 0; i < length; i++) {
		code += allChars.charAt(Math.floor(Math.random() * allChars.length));
	}
	return code;
};

export default generateCode;
