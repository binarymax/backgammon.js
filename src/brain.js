//AI
;(function(backgammon){

	var rand1 = backgammon.rand1;
	var rand2 = backgammon.rand2;

	//==================================================================	
	//AI
	backgammon.brain = (function(){
		"use strict";

		//-------------------------------------------------------------------------
		var nextid = backgammon.sequence("brain");		
		var Brain = function(config){
			var self = this;
			this.id = nextid();
			self.white = config.color==='white'?true:false;
			self.level = config.level||0;
		};
		
		//-------------------------------------------------------------------------		
		Brain.prototype.init = function(game) {
			var self = this;
			self.game = game;
		};	

		//-------------------------------------------------------------------------				
		Brain.prototype.onroll = function(roll) {
			var self = this;
			var game = self.game;
			var barpoint  = game.wtm?24:-1;
			var wtm       = game.wtm;
			var domove    = function(game,move,delay) { setTimeout(function() {game.move(move)},delay||50); };
			if (game.wtm===self.white) {
				var movenum = 0;
				var movetotal = roll.doubles?4:2;
				if (!(game.movenum>=0 && game.okmoves[game.movenum])) return false;
				var okmoves = game.okmoves[game.movenum].slice();
				var points = self.white?game.pieces.white:game.pieces.black;
				var possible = [];
				var clearstart = game.wtm?0:19;
				var clearend   = game.wtm?5:23;
				var inclear    = false;
				while(movenum<movetotal) {
					var move = null;		
					var okmove=null;
					var moveid=null;
					var onbar = game.onbar();
					var canclear = game.canclear();
					var compare = function(source){return (self.wtm?(source<=canclear):(source>=canclear))};
					possible = [];

					for(var p=0,poss,l=okmoves.length;p<l;p++) {

						if(self.game.okmove(okmoves[p].source,okmoves[p].target) && !okmoves[p].moved) {
							poss = okmoves[p];

							//Score the move
							poss.candidate = 0;
							inclear = (poss.source>=clearstart && poss.source<=clearend);
							if (game.point(poss.source)===1) poss.candidate+=10; 
							if (game.point(poss.hit)) poss.candidate+=8;
							if (game.point(poss.source)===2) poss.candidate-=5;
							if (game.point(poss.target)===1) poss.candidate+=12;
							if (game.point(poss.target)===0) poss.candidate-=7;
							if (inclear && (game.point(poss.source)===2 || game.point(poss.source)===3)) poss.candidate-=15;
							if (poss.target===999) poss.candidate+=50;
							//if (game.wtm) poss.candidate += poss.source*3;
							//if(!game.wtm) poss.candidate += (23-poss.source)*3;

							possible.push(poss);
							
						}
					}
					
					if (!possible.length) {
						//No valid moves!
						return false;
					}
					
					possible.sort(function(a,b){return a.candidate>b.candidate?-1:1});
					move = possible[0];
					self.game.move(self.game.okmove(move.source,move.target));
					movenum++;

				}

			}

		};
				
		
		//-------------------------------------------------------------------------		
		var api = function(config){
			return new Brain(config||{color:'white'});
		};
	
		//-------------------------------------------------------------------------		
		return api;	
		
	})();
	
})(backgammon);
