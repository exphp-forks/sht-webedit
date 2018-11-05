window.struct_10 = {
	ver: 10,
	editorVer: "10",
	main: [
		"unknown_head", "int16",
		"sht_off_cnt", "int16",
		"hit_radius_u", "float",
		"graze_radius_u", "float",
		"item_radius_u", "float",
		"move_nf_str", "float",
		"move_f_str", "float",
		"move_nf_dia", "float",
		"move_f_dia", "float",
		"option_pos", "option_pos",
		"sht_off", "sht_off",
		"sht_arr", "sht_arr"
	],
	option_pos: [
		"x", "float",
		"y", "float",
		"padding", "uint32" //always 0?
	],
	sht_off: [
		"offset", "uint32",
		"jank", "int32"
	],
	sht_arr: [
		"fire_rate", "byte",
		"start_delay", "byte",
		"dmg", "int16",
		"off_x", "float",
		"off_y", "float",
		"hitbox_x", "float",
		"hitbox_y", "float",
		"angle", "float",
		"speed", "float",
		"option", "byte",
		"unknown_sht_byte_0", "byte",
		"anm", "int16",
		"anm_hit", "int16",
		"unknown_sht_int16", "int16",
		"flags", "flags"
	],
	sht_off_type: "abs",
	option_pos_len: 0xF0,
	max_opt: 0x08,
	flags_len: 0x10,
	type: "maingame",
	forced_shtoffarr_len: false
};