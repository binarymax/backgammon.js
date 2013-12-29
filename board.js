//UI
;(function(){
	"use strict";

	//------------------------------------------------
	//Scalable plugin

	$.scalable = {stylesheets:[]};	

	var s, t, i, l, sheet, data, dims, rules, rule, selector, style, size, spec, repx = /^(\d+)px$/;
	for(s=0,t=document.styleSheets.length;s<t;s++) {
		sheet = document.styleSheets[s];
		if (sheet.ownerNode.attributes.scalable) {
			data = {width:parseInt(sheet.ownerNode.attributes.scalable.value),selectors:{}};
			$.scalable.stylesheets.push(data);
			rules = sheet.cssRules || sheet.rules;
			for(i=0,l=rules.length;i<l;i++) {
				rule = rules[i];
				selector = rule.selectorText;
				for(style in rule.style) {
					spec = (typeof rule.style[style] === 'string')?rule.style[style].match(repx):null;
					if(spec && spec.length && spec.length===2 && (size=parseInt(spec[1]))) {
						data.selectors[selector] = data.selectors[selector] || {};
						data.selectors[selector][style]=size;
					}
				}
			}
		}
	};
	
	//Resizes the object to fit the container
	$.fn.scalable = (function(width) {
		var $element;
		var $parent = $(this).width(width=width||window.innerWidth); 
		$.each($.scalable.stylesheets,function(index,data) {
			var scale = width/data.width, size;
			$.each(data.selectors,function(selector,styles){
				$element = $parent.find(selector).data("scalable",scale);
				if($element.length) $.each(styles,function(key,val) {
					size = Math.floor((key==="fontSize")?Math.max(val*scale,8):val*scale);
					$element.css(key,size);
				});
			});
		});
		return $parent;
	});

	//------------------------------------------------
	//Fades in an element with text
	$.fn.fadeIn = function(text){
		var self = $(this);
		return self.css({"opacity":"0.0"}).show().text(text).animate({"opacity":"1.0"},"fast");
	};

	//------------------------------------------------	
	//Drag and Drop jquery plugin
    var nobubble = function(e) {e&&e.stopPropagation&&e.stopPropagation();e&&e.preventDefault&&e.preventDefault();return false;};
	$.fn.draggable = (function() {
		
		var _zindex=1;
		var $document = $(document);
		var mover = function(item,target,offset) {
			return function(e) {
				var top  = e.clientY - offset.top + "px";
				var left = e.clientX - offset.left + "px";
				item.css({top:top,left:left});
				target.trigger("onDragMove",item);
				return nobubble(e);	
			}; 
		};

		var starter = function(target,delegate,ondrop) {
			return function(e) { 
				var item = $(this);
				var pos  = item.offset();
				var top  = e.pageY - pos.top;
				var left = e.pageX - pos.left;
				item.data("origin",pos).data("drag",true).css({zIndex:_zindex++});
				$document.on("mousemove",mover(item,target,{top:top,left:left}));
				$document.on("mouseup",stopper(item,target,ondrop));
				target.trigger("onDragStart",item);
				return nobubble(e); 
			};
		};
		
		var stopper = function(item,target,ondrop) {
			return function(e) {
				item.data("drag",false);
				$document.off("mousemove");
				$document.off("mouseup");
				target.trigger("onDrop",item);
				var okdrag = ondrop(item);
				if (okdrag==='snapback') item.animate({top:item.data("origin").top,left:item.data("origin").left},'fast');
				return nobubble(e);
			};
		};
		
		return function(delegate,ondrop) {
			if (!delegate) return false;
			var target = $(this);			
			target.on("mousedown",delegate,starter(target,delegate,ondrop));
		};

	})();

})();

(function(backgammon){
	
	var rand1 = backgammon.rand1;
	var rand2 = backgammon.rand2;
	
	//==================================================================	
	// Board	
	backgammon.board = (function(){
		"use strict";
							
		//Board constructor
		var uiid  = backgammon.sequence("backgammon-board-");
		var Board = function(container,width,config){
			var self = this;
			config = config||{};
			//config.onroll = function(){ self.onroll.apply(self,arguments); };
			self.id = uiid();
			self.ui = (typeof config.ui==='object'?config.ui:window.jQuery)?true:false;
			self.container = $('#'+container);
			self.points = new Array(24);
			self.checkers = new Array(30);
			self.checkerslots = new Array(24);
			self.dice = new Array(5);
			self.width = width||self.container.width();
			self.orientation = config.orientation?false:backgammon.defaults.orientation;
			config.ui = self;
			self.game = backgammon.game(config);
			self.draw();
			setTimeout(function(){self.game.start()},1010);
		};	
	
		
		//-------------------------------------------------------------------------		
		//Programmatically build the board HTML and place the pieces
		Board.prototype.draw = function(){
			var self = this;
			if (self.ui) {
	
				var point = 0;			
				var pieces = self.game.pieces;

				var white = '<div class="backgammon-checker backgammon-white"></div>';
				var black = '<div class="backgammon-checker backgammon-black"></div>';
				
				var html  = '<div class="backgammon-board" id="' + self.id + '"><table class="backgammon-table">';
	
				var makepoints = function(from,to,dir,vertical) {  
					var points = ''; 
					for(point  = from; (dir<0?point>to:point<to); point+=dir) { 
						points += '<td class="backgammon-point backgammon-point-' + vertical + ' backgammon-point-' + ((23-point)%2?'odd':'even') + '" id="backgammon-point-'+ (23-point) + '" data-point="' + (23-point) + '">' + 
						          '<div id="backgammon-checkers-' + (23-point) + '" class="backgammon-checkers" data-point="' + (23-point) + '"></div></td>'; 
					}
					return points;
				};
	
				//First row: top numbers
				html += '<tr><td class="backgammon-left"> </td>';
				for(point=11;point>5;point--) { html += '<td class="backgammon-notation">' + (24-point) + '</td>'; }
				html += '<td class="backgammon-bar"> </td>';
				for(point=5;point>=0;point--)  { html += '<td class="backgammon-notation">' + (24-point) + '</td>'; }
				html += '<td class="backgammon-right"> </td></tr>';
	
				//Second row: top points
				html += '<tr><td class="backgammon-left"> </td>';
				html += makepoints(11,5,-1,'top');
				html += '<td class="backgammon-bar backgammon-bar-black" data-point="-1"><div class="backgammon-checkers" data-point="-1"></div></td>';
				html += makepoints(5,-1,-1,'top');
				html += '<td class="backgammon-right">';
	
				//Black Dice
				html += '<div class="backgammon-die backgammon-die2 backgammon-black"></div>';				
				html += '<div class="backgammon-die backgammon-die3 backgammon-black"></div>';
				
				html += '</td></tr>';	

				//Third row: bottom points
				html += '<tr><td class="backgammon-left"> </td>';
				html += makepoints(12,18,1,'bottom');
				html += '<td class="backgammon-bar backgammon-bar-white" data-point="24"><div class="backgammon-checkers" data-point="24"></div></td>';
				html += makepoints(18,24,1,'bottom');
				html += '<td class="backgammon-right">';
				
				//White Dice
				html += '<div class="backgammon-die backgammon-die0 backgammon-white"></div>';				
				html += '<div class="backgammon-die backgammon-die1 backgammon-white"></div>';				
				
				html += '</td></tr>';
	
				//Fourth row: bottom numbers
				html += '<tr><td class="backgammon-left"> </td>';
				for(point=12;point<18;point++)  { html += '<td class="backgammon-notation">' + (24-point) + '</td>'; }
				html += '<td class="backgammon-bar"> </td>';
				for(point=18;point<24;point++) { html += '<td class="backgammon-notation">' + (24-point) + '</td>'; }
				html += '<td class="backgammon-right"> </td></tr>';
	
				html += '</table></div>'
	
				//Create the board inside the container 			
				self.container.html(html);
				
				//Cache Piece UI
				self.container.find(".backgammon-point").each(function(){ var point = $(this); self.points[parseInt(point.attr("data-point"))] = point; });			
				self.container.find(".backgammon-checkers").each(function(){ var slot = $(this); self.checkerslots[parseInt(slot.attr("data-point"))] = slot; });

				//Cache Dice UI
				self.dice[0] = self.container.find(".backgammon-die0");
				self.dice[1] = self.container.find(".backgammon-die1");
				self.dice[2] = self.container.find(".backgammon-die2");
				self.dice[3] = self.container.find(".backgammon-die3");

				self.barwhite = self.container.find(".backgammon-bar-white");
				self.barblack = self.container.find(".backgammon-bar-black");
				self.barwhiteslot = self.barwhite.find(".backgammon-checkers");
				self.barblackslot = self.barblack.find(".backgammon-checkers");

				for(var n=0;n<self.game.pieces.barwhite;n++) self.barwhiteslot.append(white).data('color','white');
				for(var n=0;n<self.game.pieces.barblack;n++) self.barblackslot.append(black).data('color','black');

				//Add all the pieces according to the position
				for(var p=0;p<24;p++) {
					var $point  = self.points[p];
					var $pieces = self.checkerslots[p];
					for(var n=pieces.white[p]||0;n;n--) $pieces.append(white).data('color','white');
					for(var n=pieces.black[p]||0;n;n--) $pieces.append(black).data('color','black');
				
				}
				
				
				//Resize the container
				self.container.scalable(self.width);
				self.container.find('.backgammon-point').map(function(){self.placechildren($(this).attr("data-point"))});
				self.placechildren(-1);
				self.placechildren(24);
				
				//Drag pieces around the board
				self.container.draggable(".backgammon-checker",function(piece){
					var point = self.onpoint(piece);
					var source;
					var target;
					piece.attr("data-dirty","1");
					if (point)  {
						source = parseInt(piece.parent().attr('data-point'));
						target = parseInt(point.find(".backgammon-checkers").attr('data-point'));
					} else {
						source = parseInt(piece.parent().attr('data-point'));
						target = 999;
					}
					var move   = self.move(source,target);
					if (move==='snapback') piece.attr("data-dirty","0");
					return move;

				});
				
			}
		};

		//-------------------------------------------------------------------------		
		//Outputs a board into a position
		Board.prototype.toString = function() {
			return this.game.toString();
		};
		
		//-------------------------------------------------------------------------		
		//Places the children of a point
		Board.prototype.placechildren = function(point,nodelay){
			var self    = this;
			var $point,$pieces;
				point = parseInt(point);
			if (point===24) {
				$point = self.barwhite;
				$pieces = self.barwhiteslot;
			} else if (point===-1) {
				$point = self.barblack;
				$pieces = self.barblackslot;
			} else {
				$point  = self.points[point];
				$pieces = self.checkerslots[point];
			}
			var offset  = $point.offset();
			var checker = $point.find(".backgammon-checker:first").outerHeight() * (point<12?-1:1);
			var fromtop = point<12?$point.outerHeight()+checker:0;
			var checkers = $pieces.find(".backgammon-checker");
			var n = 0, x = 0;
			checkers.each(function(){
				var pointleft = offset.left;
				var pointtop  = offset.top  + fromtop + (n++*checker);
				var $piece = $(this).attr("backgammon-data-top",pointtop).attr("backgammon-data-left",pointleft)
				setTimeout(function(){$piece.animate({top:pointtop + 'px',left:pointleft + 'px'},'fast');},(!nodelay?n*50:0));	
			});
			$point.data("dirty",false);
		};

		//-------------------------------------------------------------------------		
		//Moves a piece from source to target		
		Board.prototype.place = function(piece,target){
			var self = this;
			var source       = parseInt(piece.parent().attr("data-point"));
			var sourcepoint  = self.points[source];
			var targetpoint  = self.points[target];
			var targetpieces = self.checkerslots[target];
			if (isNaN(source)) console.log(piece.parent().html());
			piece.remove();
			self.placechildren(source,true);
			if(target!==999) {
				piece.appendTo(targetpieces.data("dirty",true));
				self.placechildren(target,true);
			}
			self.placechildren(-1,true);
			self.placechildren(24,true);
			piece.attr("data-dirty","");
		};
		
		//-------------------------------------------------------------------------		
		//Updates the piece positions on the board
		Board.prototype.update = function(mymove) {
			var self = this;
			if (mymove.hit && self.game.pieces.barwhite>0) {
				var barred = self.points[mymove.target].find('.backgammon-checker.backgammon-white');
				barred.remove().appendTo(self.barwhite.find('.backgammon-checkers'));
			}
			if (mymove.hit && self.game.pieces.barblack>0) {
				var barred = self.points[mymove.target].find('.backgammon-checker.backgammon-black');
				barred.remove().appendTo(self.barblack.find('.backgammon-checkers'));
			}
			var piece = self.container.find(".backgammon-checker[data-dirty='1']");
			if(!piece.length) {
				switch (mymove.source) {
					case -1:piece = self.barblackslot.children(":first-child"); break;
					case 24:piece = self.barwhiteslot.children(":first-child"); break;
					default:piece = self.checkerslots[mymove.source].children(":last-child"); break;
				}
			}
			if (piece.length) self.place(piece,mymove.target);
		};

		//-------------------------------------------------------------------------		
		//Moves a piece		
		Board.prototype.move = function(source,target) {
			var self = this;
			var okmove = self.game.okmove(source,target);

			if(!okmove) return 'snapback'

			return self.game.move(okmove);
		};
	
		//-------------------------------------------------------------------------		
		//Rolls the dice
		Board.prototype.roll = function(){
			var self = this;
			self.game.roll();
		};
	
		//-------------------------------------------------------------------------		
		//Called when the Game logic rolls the dice
		Board.prototype.onroll = function(roll) {
			var self = this;
			if (roll.color==='white') {
				self.dice[0].fadeIn(roll.die1);
				self.dice[1].fadeIn(roll.die2);
				self.dice[2].hide();
				self.dice[3].hide();
			} else {
				self.dice[0].hide();
				self.dice[1].hide();
				self.dice[2].fadeIn(roll.die1);
				self.dice[3].fadeIn(roll.die2);
			}
		};

		//-------------------------------------------------------------------------		
		//Returns point that a piece is dragged to, otherwise returns null		
		Board.prototype.onpoint = function(piece){
			var self = this;
			var piecex = parseInt(piece.offset().left + piece.width()/2);
			var piecey = parseInt(piece.offset().top + piece.height()/2);
			var $point = null;
			self.container.find(".backgammon-point").each(function(){
				var point = $(this);
				var pointtop = parseInt(point.offset().top);
				var pointleft = parseInt(point.offset().left);
				var pointright = parseInt(pointleft + point.outerWidth());
				var pointbottom = parseInt(pointtop + point.outerHeight());
				if (piecey<pointbottom && piecey>pointtop && piecex<pointright && piecex>pointleft) {
					$point = point;
					return false;
				}
			});
			return $point;
		};

		//-------------------------------------------------------------------------						
		var api = function(board,width,config){
			return new Board(board,width,config||{});
		};
	
		//-------------------------------------------------------------------------			
		return api;	
		
	})();

})(backgammon);

(function(){
	
	backgammon.new0PGame = function(id,total,delay,position) {
		var width=parseInt(window.innerWidth*2/3);
		if (total%5===0) width = width/4;
		else if (total%4===0) width = width/3;
		else if (total%3===0) width = width/2;
		else if (total%2===0) width = width/1;
		var whiteai = backgammon.brain({color:'white',level:0});
		var blackai = backgammon.brain({color:'black',level:1});
		var boardui = $("<div id='"+id+"' style='float:left;'><div>");
		if (isNaN(delay)) delay = gammon.defaults.delay;
		var config = {delay:delay,white:whiteai,black:blackai};
		if (position) config.position = position;
		$("#boards").append(boardui);
		return backgammon.board(id,width,config);
	};


	backgammon.new1PGame = function(delay,position) {
		var id = nextid();
		var width=parseInt(window.innerWidth*2/3);
		var blackai = backgammon.brain({color:'black',level:1});
		var boardui = $("<div id='"+id+"' style='float:left;'><div>");
		if (isNaN(delay)) delay = gammon.defaults.delay;
		var config = {delay:delay,black:blackai};
		if (position) config.position = position;
		$("#boards").append(boardui);
		return backgammon.board(id,width,config);
	};

	//------------------------------------------------------------------
	//Backgammon tournament of multiple boards
	backgammon.tournament = function(total,delay,position) {
		total = total || 1;
		var boards = {};
		var nextid = backgammon.sequence("board");
		for(var i=0,id;i<total;i++) { 
			id = nextid();
			boards[id] = backgammon.new0PGame(id,total,delay,position);
		};
		
		return boards;
		
	};
		
})(backgammon);