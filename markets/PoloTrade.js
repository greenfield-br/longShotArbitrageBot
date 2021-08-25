

var fs = require('fs');
var keys = JSON.parse(fs.readFileSync(__dirname+'/keys.json', 'utf8'));

var POLO = require("./api/poloniex");
var polo = new POLO(keys["poloniex"]["key"], keys["poloniex"]["secret"]);
const PoloWS = require('poloniex-orderbook');
const polows = new PoloWS().connect({ headers: require('./headers.json') });
var console = process.console;
const markets = {};
const maxCheckAttempts = 5400;
var checkAttempt = 0;

function PoloTrade(pairs){
	
	this.mode="";
	this.block=false;
	this.orderbook={};
	for (const pair of pairs) {
	  markets[pair] = polows.market(pair);
	}
}
//finish this function
PoloTrade.prototype.getOrders = function(){
	var self = this;
	polows.on('change', info => {
	  	const { side, channel } = info;
	  	const res = markets[channel][side].slice(0, 1);
	  	if(!self.orderbook.hasOwnProperty(channel)){
			self.orderbook[channel]={
				 "bids":{
				 	"price":0,
				 	"amount":0
				 },
				 "asks":{
				 	"price":0,
				 	"amount":0
				}

			}
		}

	 	self.orderbook[channel][side]["price"] = parseFloat(info["rate"]);
	 	self.orderbook[channel][side]["amount"] = parseFloat(info["amount"]);

	});
	
};


PoloTrade.prototype.trade = function(pair, rate, amount, callback){
	var self= this;
	console.tag("Polo").log(pair+" Entering into trade");
	var params;
	switch(self.mode){
		case "buy":
		params ={
			"pair"  : pair,
			"type"  : "buy",
			"rate"  : rate.toString(),
			"amount": amount.toString()
			};	
		break;
		case "sell":
			params ={
			"pair"  : pair,
			"type"  : "sell",
			"rate"  : rate.toString(),
			"amount": amount.toString()
			};	
		break;
	}
	
	polo.trade(params, function(err, data){
		if(!err){
				console.tag("Polo").log(pair+" Order was created: rate "+params.rate +" amount "+ params.amount+" id "+data["orderNumber"]);
				setTimeout(function(){
					checkOrder(self, pair, data["orderNumber"], function(){
						callback();
					});
					
				},1000);
				
				
		}else{
			
			console.tag("Polo").log(err);
		}
	}); 
	
};


function checkOrder(self, pair, orderId, callback){
	//called on each iteration
	checkAttempt++;
	if(checkAttempt < maxCheckAttempts){
		if(orderId && orderId !==0){
			polo.returnOpenOrders(pair, function(err, data){
				if(!err){
					var activeOrders = [];
					for(var order=0; order<data.length; order++){
						activeOrders.push(String(data[order]["orderNumber"]));
					}
					if(activeOrders.indexOf(orderId.toString()) > -1){
							setTimeout(function(){
					        	return	checkOrder(self,pair, orderId, callback);
							},2000);
							
					}else{
						console.tag("Polo").log(pair+" Order has been closed");
						//reset check attepmts
						checkAttempt=0;
						return	callback();
					}
					
				}else{
						console.tag("Polo").log(err);
						
						setTimeout(function(){
					        	return	checkOrder(self, pair, orderId, callback);
							},2000);
						
					}
			});
		}else{
				console.tag("Polo").log(pair+" Order has been executed immediately");
				//reset check attepmts
				checkAttempt=0;
				return	callback();
			}
	}else{
		console.tag("Polo").log(pair+" Max number of checks exceeded. Leaving order");
		//reset check attepmts
		checkAttempt=0;
		return callback();
	}
}

PoloTrade.prototype.getBalance = function(pair, callback){
	var self = this;
	polo.returnBalances(function(err, data){
		var buyCurr =pair.split("_")[0];
		var sellCurr =pair.split("_")[1];
		if(!err){
			
			var buyAmount = parseFloat(data[buyCurr]);
			var sellAmount = parseFloat(data[sellCurr]);
			return callback({
							[buyCurr]: buyAmount,
							[sellCurr]: sellAmount
						});

		}else{
			 console.tag("Polo").log(err);
			 return callback({
				[buyCurr]: -Infinity,
				[sellCurr]: -Infinity
			});
		}
	});
};
polows.on('error', err => console.log(err));

module.exports = PoloTrade;