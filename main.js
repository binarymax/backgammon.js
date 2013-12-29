//Namespace
;var backgammon = (function(context) {
	"use strict";

	var gammon = context.backgammon = {};

	//------------------------------------------------------------------	
	//ID generator
	gammon.sequence = function(type) {
		var id = 0;
		return function(){ return type+(id++); } 
	};

	//------------------------------------------------------------------	
	//Random number helpers
	gammon.rand1 = function(max){ return Math.floor(Math.random()*max); };
	gammon.rand2 = function(min,max){ return Math.floor(Math.random() * (max - min + 1)) + min; };
		
	//------------------------------------------------------------------	
	//Defaults
	gammon.defaults = {
		orientation:true,
		delay:505,
		position:'2W////5B/3B///5W5B///3W/5W////2B W 00 0 00'
	};
	
	//------------------------------------------------------------------
	return gammon;

})(this);