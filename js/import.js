let file = null;
let reader = null;

function openFile(files) {
	let sht = files[0];
	$filename.value = sht.name;
	reader = new FileReader();
	reader.onload = f => file = f;
	reader.readAsArrayBuffer(sht);
};

function readFile() {
	if (!file) return;
	let arrayBuffer = reader.result;
	let array = new Uint8Array(arrayBuffer);
	log("file loaded");
	console.log(array);
	let struct = getStruct($ver);
	currentStruct = struct;
	log("sht version "+$ver.value);
	try {
		readSht(array, struct);
		setFileInfo($filename.value + " (v"+struct.ver+")");
	} catch(e) {
		log("An error has occurred while parsing the .sht file. Have you selected the right .sht version?");
		error(e.toString());
		throw e;
	};
};

function readSht(arr, struct) {
	log("reading file");
	let main = struct.main;
	let offset = 0;
	let i = 0;
	let data = {};
	if (struct.ver == 10) data.pwr_lvl_cnt = 4; // janky format of a janky game

	while(offset < arr.length) {
		let prop = main[i], type = main[i+1];
		let val, len;
		log("read "+prop+" ("+type+")");
		switch(type) {
			//number types
			case "byte":
				len = 1;
				val = arr[offset];
			break;
			case "int16":
				len = 2;
				val = readInt16(arr[offset+1], arr[offset]);
			break;
			case "int32":
				len = 4;
				val = readInt32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;
			case "uint32":
				len = 4;
				val = readUint32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;
			case "float":
				len = 4;
				val = readFloat(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;

			//special cases
			case "option_pos":
				len = struct.option_pos_len;
				let max = struct.ver > 12 ? struct.max_opt : data.pwr_lvl_cnt;
				val = readOptionPos(arr, offset, max, struct.ver);
			break;
			case "sht_off":
				len = data.sht_off_cnt*4;
				val = readShtOff(arr, offset, data.sht_off_cnt, struct);
			break;
			case "sht_arr":
				len = 99999999999999999999999;
				val = readShtArr(arr, offset, data.sht_off, struct.sht_arr, struct.flags_len, data.pwr_lvl_cnt, struct.sht_off_type);
			break;
			default:
				throw "unknown datatype - "+type;
			break;
		};
		data[prop] = val;
		offset += len;
		i+=2;
	};
	generateEditorTable(data, struct);
};

function readShtArr(arr, offset, sht_off, struct, flags_len, pwr_lvl_cnt, off_type) {
	let shooters = {
		unfocused: [],
		focused: [],
		extra: [] // trance in TD is a separate shooterset
	};
	for (let i=0; i<sht_off.length; i++){
		let foc;
		if (currentStruct.type == "maingame") {
			foc = i >= (pwr_lvl_cnt+1) ? "focused" : "unfocused";	
			if (i >= (pwr_lvl_cnt+1)*2) foc = "extra";
		} else {
			// photogames are weird
			foc = "extra";
		};
		let off = off_type == "rel" ? offset + sht_off[i] : sht_off[i];
		let val = readOneSht(arr, off, struct, flags_len, i);
		shooters[foc].push(val);
	};
	return shooters;
};

function readOneSht(arr, offset, struct, flags_len, pow) {
	log("read shtset "+pow);
	let i = 0;
	let data = [];
	let shooter = 0;
	while(offset < arr.length) {
		if ((i >= struct.length || i == 0) && (arr[offset] == 255 && arr[offset+1] == 255 && arr[offset+2] == 255 && arr[offset+3] == 255)) break;
		if (i >= struct.length) {
			i = 0;
			shooter++;
		};
		let prop = struct[i], type = struct[i+1];
		let val, len;
		switch(type) {
			//number types
			case "byte":
				len = 1;
				val = arr[offset];
			break;
			case "int16":
				len = 2;
				val = readInt16(arr[offset+1], arr[offset]);
			break;
			case "int32":
				len = 4;
				val = readInt32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;
			case "uint32":
				len = 4;
				val = readUint32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;
			case "float":
				len = 4;
				val = readFloat(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
			break;

			//special cases
			case "flags":
				len = flags_len;
				val = [];
				for (let i=0; i<len; i+=2) {
					val.push(readInt16(arr[offset+i+1], arr[offset+i]));
				};
			break;
			default:
				throw "unknown datatype - "+type;
			break;
		};
		if (!data[shooter]) data[shooter] = {};
		data[shooter][prop] = val;
		offset += len;
		i+=2;
	};
	return data;
};

function readShtOff(arr, offset, cnt, struct) {
	let off = [];
	let off_struct = struct.sht_off;
	for (let i=0; i<cnt; i++) {
		for (let j=0; j<off_struct.length; j+=2) {
			if (off_struct[j] == "offset") {
				let val = readUint32(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
				off.push(val);
			};
			offset += 4;
		};
	};
	return off;
};

function readOptionPos(arr, offset, max_opt, ver) {
	let opts = {
		unfocused: [],
		focused: []
	};
	for (let focused=0; focused<2; focused++) {
		for (let power=1; power<=max_opt; power++) {
			for (let i=0; i<power; i++) {
				let x = readFloat(arr[offset+3], arr[offset+2], arr[offset+1], arr[offset]);
				let y = readFloat(arr[offset+7], arr[offset+6], arr[offset+5], arr[offset+4]);
				if (!opts[focused ? "focused" : "unfocused"][power]) opts[focused ? "focused" : "unfocused"][power] = [];
				opts[focused ? "focused" : "unfocused"][power].push({
					x: x,
					y: y
				});
				offset += 8;
				if (ver == 10) offset += 4;
			};
		};
	};
	return opts;
};