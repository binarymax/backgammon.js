//Game
;(function(backgammon){

	var rand1 = backgammon.rand1;
	var rand2 = backgammon.rand2;

	//==================================================================	
	//Game
	backgammon.game = (function(){
		"use strict";
	
		//-------------------------------------------------------------------------		
		var moveid = backgammon.sequence("move");		
		var Move   = function(die,source,target,hit) {
			this.id=moveid();
			this.die=die;
			this.source=source;
			this.target=target;
			this.hit=hit;
			this.used=0;
			this.candidate=-999;
		};
	
		//-------------------------------------------------------------------------		
		var gameid = backgammon.sequence("game");
		var Game = function(config){
			var self = this;
			self.id  = gameid();
			self.wtm    = true; //white to move
			self.rolls  = [];
			self.moves  = [];
			self.okmoves= [];
			self.movenum= 0;
			self.pieces = {white:new Array(24),black:new Array(24),offwhite:0,offblack:0,barwhite:0,barblack:0};
			self.toroll = null;
			self.board  = config.ui||null;
			self.white  = config.white||null; 
			self.black  = config.black||null;
			self.delay  = config.delay||null;
	
			self.setup(config.position);
	
			if (self.white) {
				self.white.init(self);
			}
	
			if (self.black) {
				self.black.init(self);
			}
	
		};
	
		//-------------------------------------------------------------------------		
		//Loads a board position
		Game.prototype.setup = function(positionstring){
			var self = this;
			var posarray = (positionstring||backgammon.defaults.position).toUpperCase().split(' ');
			var position = self.position = posarray[0];
			var c,n,p=23,i=0,l=position.length;
			var D='/'.charCodeAt(0),W='W'.charCodeAt(0),B='B'.charCodeAt(0);
			self.pieces.offwhite = 0;
			self.pieces.offblack = 0;
			self.pieces.barwhite = 0;
			self.pieces.barblack = 0;
			while(i<l && p>-1) {
				//points
				c=position.charCodeAt(i);
				n=position.charCodeAt(i+1);
				self.pieces.white[p] = 0;
				self.pieces.black[p] = 0;
				if(c===D) {
					//Delimiter detected, next point
					p--;
				} else if(n && (c>=49 || c<=57)) {
					//Digit detected, add pieces and next point
					self.pieces.white[p] = n===W ? c - 48 : 0;
					self.pieces.black[p] = n===B ? c - 48 : 0;
					i++;
					p--;
				}
				//next char
				i++;
			}
			//Color to move:
			self.wtm = (posarray[1]||'W')==='W';
	
			//Checkers On the Bar
			positionstring = posarray[2]||'00';
			self.pieces.barwhite = parseInt(positionstring.charAt(0),16);
			self.pieces.barblack = parseInt(positionstring.charAt(1),16);
	
			//Full Moves
			self.fullmove = parseInt(posarray[3]||'0');
	
			//Dice Roll			
			positionstring = posarray[4]||'00';
			if (positionstring!=='00') {
				self.toroll = {
					die1:parseInt(positionstring.charAt(0)),
					die2:parseInt(positionstring.charAt(1))
				};
			}
		};
		
		Game.prototype.start = function() {
			var self = this;
			if (self.toroll) {
				self.roll(self.toroll.die1,self.toroll.die2);
				self.toroll = null;
			} else {
				self.roll();
			}
		};
	
		/*-------------------------------------------------------------------------
		Outputs a board into a position
		Ported from https://en.wikipedia.org/wiki/Forsyth-Edwards_Notation
		 1. Piece placement (from white's perspective). Each point is described, starting with 24 and ending with point 1; within each point, the number and color of checkers is described. (white = "W", black = "B". Empty points are denoted by "/".
		 2. Active color. "W" means white moves next, "B" means black.
		 3. Two digits in hexadecimal format (0 for none, F for 15). The first digit is the number of white checkers on the bar,  the second digit is the number of black checkers on the bar.
		 4. Full move number: The number of the full move. It starts at 1, and is incremented after blacks move.
		 5. Two digits numbered 0 through 6.  The first and second are the values rolled for two dice (1 to 6).  If a digit is zero, it denotes the die is yet to be rolled.
		*/
		Game.prototype.toString = function() {
			var self = this;
			var pos = "";
			var whites = self.pieces.white;
			var blacks = self.pieces.black;
	
			var wtot = self.pieces.barwhite,btot = self.pieces.barblack;
	
			//Points 24 to 1
			for(var point=23;point>=0;point--) {
				if(whites[point]) pos += whites[point] + 'W';
				else if(blacks[point]) pos += blacks[point] + 'B';
				else pos += '/';
				wtot+=whites[point];
				btot+=blacks[point];
			}
			
			pos += ' ';		
			
			//Color to move
			pos += self.wtm?'W':'B';
			
			pos += ' ';			
			
			//White pieces on the bar
			pos += self.pieces.barwhite;
			pos += self.pieces.barblack;
	
			pos += ' ';			
	
			//Full Move count
			pos += self.fullmove;
	
			pos += ' ';			
	
			//Roll
			pos += self.rolls[self.movenum]?self.rolls[self.movenum].die1:'0';
			pos += self.rolls[self.movenum]?self.rolls[self.movenum].die2:'0';
	
			return pos;
		};
		
		//-------------------------------------------------------------------------
		Game.prototype.point = function(p) {
			var self = this;
			switch(p) {
				case -1: return self.pieces.barblack;
				case 24: return self.pieces.barwhite;
				case 999:return self.canclear()!==false?1:0;
				default: return self.wtm?self.pieces.white[p]:self.pieces.black[p];
			} 
		};
		
		//-------------------------------------------------------------------------
		Game.prototype.pointcolor = function(p) {
			var self = this;
			switch(p) {
				case -1: return self.wtm?false:true;
				case 24: return self.wtm?true:false;
				case 999:return self.canclear()!==false;
				default: return (self.pieces.white[p] && self.wtm) || (self.pieces.black[p] && !self.wtm);
			} 
		};

		//-------------------------------------------------------------------------
		Game.prototype.nextmove = function() {
			var self = this;
			if (self.delay) {
				setTimeout(function(){
					if(!self.wtm) self.fullmove++;				
					self.wtm = !self.wtm;
					self.movenum++;
					self.roll();
				},self.delay);
			} else {
				if(!self.wtm) self.fullmove++;				
				self.wtm = !self.wtm;
				self.movenum++;
				self.roll();
			}
		};
		
		//-------------------------------------------------------------------------
		Game.prototype.canmove = function() {
			var self = this;
			var okmoves = self.okmoves[self.movenum];
			var okmove  = null;
			for(var i=0,l=okmoves.length;i<l;i++) {
				okmove = okmoves[i];
				if(self.okmove(okmove.source,okmove.target) && !okmove.moved) return true;
			}
			return false;
		};
		
		//-------------------------------------------------------------------------
		Game.prototype.haswon = function() {
			var self = this;
			if (self.wtm && self.pieces.barwhite>0) return false;
			if(!self.wtm && self.pieces.barblack>0) return false;
			var pieces = self.wtm?self.pieces.white:self.pieces.black;
			for(var i=0,l=pieces.length;i<l;i++) {
				if(pieces[i]>0) return false;
			}
			return true;
		};

		//-------------------------------------------------------------------------
		//Finalize a piece move and add it to the position and history
		Game.prototype.move = function(okmove) {
			var self = this;
			var player=self.wtm?'white':'black';
			var waiter=self.wtm?'black':'white';
			okmove.color = player;
			okmove.roll  = self.rolls[self.movenum];
			okmove.notation = ' ' + self.movenum + '.' + okmove.source + '/' + okmove.target;

			//Decrement source point count
			switch(okmove.source) {
				case -1:self.pieces.barblack--; break;
				case 24:self.pieces.barwhite--; break;
				default:self.pieces[player][okmove.source]--;
			};

			//Increment target point count
			self.pieces[player][okmove.target]++;
			
			if (okmove.hit) {
				//Decrement target point count for opponent
				self.pieces[waiter][okmove.target]--;
				//Increment bar count for opponent
				self.pieces['bar'+waiter]++;
				//Notation
				okmove.notation+='*';
			}

			if(okmove.roll.die1===okmove.die) okmove.roll.used1++;
			else if(okmove.roll.die2===okmove.die) okmove.roll.used2++;
						
			self.moves.push(okmove);
			self.okmoves[self.movenum].moved = (self.okmoves[self.movenum].moved||0) + 1;
			if (self.board) self.board.update(okmove);

			if (self.haswon()) {
				//WINNER WINNER CHICKEN DINNER!
				console.log('WINNER!',self.id,player);
				self.winner = player;
				return null;
			} else if (self.okmoves[self.movenum].moved>(self.rolls[self.movenum].doubles?3:1)) {
				self.nextmove();
			} else if (!self.canmove()) {
				self.nextmove();
			}
			return okmove;
		};
	
		//-------------------------------------------------------------------------
		//Roll ze dice!	
		Game.prototype.roll = function(die1,die2){
			var self = this;
			var roll = self.rolls[self.movenum];
			if(!roll) {	
				die1 = parseInt(die1);
				die2 = parseInt(die2);
				var val1 = (!isNaN(die1)&&die1>=1&&die1<=6)?die1:rand2(1,6);
				var val2 = (!isNaN(die2)&&die2>=1&&die2<=6)?die2:rand2(1,6);
				var roll = { 
					die1    : val1, 
					die2    : val2,
					used1   : 0,
					used2   : 0,
					doubles : val1===val2,
					color	: self.wtm?'white':'black'
				}
	
				self.rolls[self.movenum] = roll;
		
				self.generatemoves();

				if(self.okmoves[self.movenum].length===0) {
					//No moves available
					self.nextmove();
				}

			}
	
			//Tell the subscribing modules that we've rolled
			if (self.board) self.board.onroll(roll);
			if (self.white) self.white.onroll(roll);
			if (self.black) self.black.onroll(roll);				

			return roll;
		};
		
		//-------------------------------------------------------------------------
		//Returns true if the player to move has pieces on the bar
		Game.prototype.onbar = function() {
			var self = this;
			return ((self.wtm && self.pieces.barwhite>0) || (!self.wtm && self.pieces.barblack>0));
		};		
		
		//-------------------------------------------------------------------------
		//Returns true if the player to move can clear pieces
		Game.prototype.canclear = function() {
			var self = this;
			if(self.onbar()) return false;
			var begin = self.wtm?5:0;
			var end = self.wtm?24:18;
			var pieces = self.wtm?self.pieces.white:self.pieces.black;
			for(var point=begin;point<end;point++) if(pieces[point]>0) return false;
			//TODO - find maximum point
			if(self.wtm) {
				for(var point=5;point>=0;point--) {if(pieces[point]>0) return point;}
			} else {
				for(var point=19;point<=23;point++) {if(pieces[point]>0) return point;}
			}
			return self.wtm?0:23;
		};		
	
		//-------------------------------------------------------------------------
		//Generates all the possible moves for a turn, based on current position and roll
		Game.prototype.generatemoves = function() {
			var self = this;
			var moves = [];
			var roll = self.rolls[self.movenum];
			var die1 = roll.die1;
			var die2 = roll.die2;
			var die0;
			var player = self.wtm?self.pieces.white:self.pieces.black;
			var waiter = self.wtm?self.pieces.black:self.pieces.white;
			var direction = self.wtm?-1:1;
	
			//Flags and Values for moves
			var hittarget0,hittarget1,hittarget2,hittarget3,hittarget4;
			var oktarget0,oktarget1,oktarget2,oktarget3,oktarget4;
			var target0,target1,target2,target3,target4;
			var possible,doublesource,barsource,bartarget,bardie;
		
			if (self.onbar()) {
				//Pieces on bar!
				barsource = self.wtm?24:-1;
				for(var d=1;d<3;d++) {
					bardie    = (d===1?die1:die2)
					bartarget = self.wtm?Math.abs(bardie-24):bardie-1;
					if (waiter[bartarget]<2) {
						//Can move a checker from bar to point
						hittarget0=waiter[bartarget]===1?true:false;
						possible = new Move(bardie,barsource,bartarget,hittarget0);
						moves.push(possible);
						die0 = (d===1?die2:die1)
						target0 = self.wtm?bartarget-die0:bartarget+die0;
						if (waiter[target0]<2) {
							//Can move a recently debarred checker from bartarget to point
							hittarget0=waiter[target0]===1?true:false;
							possible = new Move(die0,bartarget,target0,hittarget0);
							moves.push(possible);
						}
					}
				}
				if (!moves.length) {
					//On bar with no moves - blocked!
					self.okmoves[self.movenum] = moves;
					return moves;
				}
			}
			
			var check = function(source,target,die) {
				if ((0<=target && target<=23) && (waiter[target]<2)) {
					var hit=waiter[target]===1?true:false;
					var possible = new Move(die,source,target,hit);
					moves.push(possible);
					return true;
				}
				return false;
			}
						
			//For Each point 
			for(var point=0;point<24;point++) {
				oktarget1=false; oktarget2=false; oktarget3=false;
				if (player[point]>0) {
					if (!roll.doubles) {
						//If point has checkers
						target1 = point + die1*direction;
						target2 = point + die2*direction;
						target3 = point + die1*direction + die2*direction;
	
						//Can move a checker from point to die1 spaces
						oktarget1 = check(point,target1,die1);
						
						//Can move a checker from point to die2 spaces						
						oktarget2 = check(point,target2,die2);
						
						//Can move from point die1 spaces then same checker die2 spaces						
						if(oktarget1) oktarget3 = check(target1,target3,die2);
						
						//Can move from point die2 spaces then same checker die1 spaces						
						if(oktarget2) oktarget4 = check(target2,target3,die1);
	
					} else {
						//Doubles!
						doublesource = point;
						target4 = point + die1*direction;
						for(var d=0;d<4;d++) {
							if(check(doublesource,target4,die1)) {
								doublesource += die1*direction;
								target4 += die1*direction;
							}
						}
					}
				}
			}
	
			//Can clear checkers from the board
			var canclear = self.canclear();
			if (canclear!==false) {
				var clearfrom = self.wtm?0:canclear;
				var clearto   = self.wtm?canclear:23;
				for(var point = clearfrom;point<=clearto;point++) {
					if (!roll.doubles) {
						if (clearto-point<=roll.die1) {
							var possible = new Move(die1,point,999,false);
							moves.push(possible);
						}
						if (clearto-point<=roll.die2) {
							var possible = new Move(die2,point,999,false);
							moves.push(possible);
						}
					} else {
						if (clearto-point<=roll.die1) {
							for(var i=0;i<4;i++) {
								var possible = new Move(die1,point,999,false);
								moves.push(possible);
							}
						}
					}					
				}
			}
	
			self.okmoves[self.movenum] = moves;
			return moves;
		};
		
		//-------------------------------------------------------------------------
		//Tests if a move is OK, if so return it.  Otherwise return null
		Game.prototype.okmove = function(source,target) {
			var self = this;
	
			source = parseInt(source);
			target = parseInt(target);
	
			var canclear = self.canclear()!==false && target===999;
	
			//Validate source and target;
			if (isNaN(source) || isNaN(target) || source<-1 || source>24 || target<0 || (target>24 && !canclear)) return false;
	
			//Color of checkers to move
			var pieces = self.wtm?self.pieces.white:self.pieces.black;
	
			if (self.onbar()) {
				//Pieces on the bar - must move one
				if( self.wtm && source!==24) return null;
				if(!self.wtm && source!==-1) return null;
				
			} else if (!pieces[source]) {
				//No checkers on the source point
				return null;
			}
			
			var okmove = null;
			var okmoves = self.okmoves[self.movenum];
			var roll  = self.rolls[self.movenum];
			var dist  = Math.abs(target - source);
			var clear = self.wtm?source:24-source;
			var max   = roll.doubles?3:1;
	
			var dist1 = dist===roll.die1;
			var dist2 = dist===roll.die2;
			var used1 = roll.used1<max;
			var used2 = roll.used2<max;
			var clear1 = canclear && clear<=roll.die1;
			var clear2 = canclear && clear<=roll.die2;
	
			if ( ((dist1 || clear1) && used1) || ((dist2 || clear2) && used2) ) {
	
				//Source to target fits an available die distance
				for(var i=0,l=okmoves.length;i<l;i++) {
					var move = okmoves[i];
					if (move.source===source && move.target===target && (move.used<max)) {
						//Move found.  Tally die used and return
						if(dist1 || clear1) {
							okmove = move;
							break;
						} else if(dist2 || clear2) {
							okmove = move;
							break;
						}
					}
				}
			}
			return okmove;
		};
		
		//-------------------------------------------------------------------------		
		//Backgammon Public API call
		var api = function(config){
			return new Game(config||{});
		};
		
		//-------------------------------------------------------------------------		
		return api;
	
	})();

})(backgammon);