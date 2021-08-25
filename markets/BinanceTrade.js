const fs = require('fs');
const keys = JSON.parse(fs.readFileSync(__dirname+'/keys.json', 'utf8'));
const BNC = require('node-binance-api');
const binance = new BNC().options({
  APIKEY: keys["binance"]["key"],
  APISECRET: keys["binance"]["secret"],
  useServerTime: true, 
  test: false // If you want to use sandbox mode where orders are simulated
});


var console = process.console;

const maxCheckAttempts = 5400;
var checkAttempt = 0;


function BinanceTrade(pairs){
	this.mode="";
	this.block=false;
	this.orderbook = {};
	this.pairsLimits={};
	this.pairs = pairs;
	for(pair of pairs){
			this.orderbook[pair]={
				'bids':{
					'price':0,
					'amount':0
				},
				'asks':{
					'price':0,
					'amount':0
				}
			}
	}

	var self = this;
	getMinOrderSize(pairs, function(limits){
		console.tag('Init').log("Initializing coins requirements ");
		self.pairsLimits = limits
		console.tag('Init').log(self.pairsLimits);
	});
}


function getMinOrderSize (pairs, callback){
	binance.exchangeInfo(function(err, data) {
		if(!err){
			var res ={}
			for(var pair of pairs){
				for(var elem of data.symbols){
					if(elem["symbol"]==pair){
						res[elem['baseAsset']]={BTCPrice:0, rounding:0}
						for(filter of elem.filters){
							
							
							if(filter['filterType']  =='MIN_NOTIONAL'){
								
								res[elem['baseAsset']].BTCPrice= parseFloat(filter['minNotional']);
							}
							else if(filter['filterType']  =='LOT_SIZE'){
								let round = filter['stepSize'].split('.')[1].indexOf('1')+1;
								
								res[elem['baseAsset']].rounding = round;

								}
						}
						
					}
				}
			}
		}else{
			console.tag("Error").log("Error occured while requesting min order sizes");
			console.tag("Error").log(err);
			setTimeout(function(){
				getMinOrderSize(pairs, callback);
			}, 1000);
		}

		return callback(res);
	});
}

BinanceTrade.prototype.getOrders = function(){
	var self = this
	binance.websockets.depth(this.pairs, (depth) => {
		if(depth['b'].length > 0 && parseFloat(depth['b'][0][1]) >0){
			self.orderbook[depth['s']]['bids']['price']= parseFloat(depth['b'][0][0])
			self.orderbook[depth['s']]['bids']['amount']= parseFloat(depth['b'][0][1])
		}
		if(depth['a'].length > 0  && parseFloat(depth['a'][0][1]) >0){
			self.orderbook[depth['s']]['asks']['price']= parseFloat(depth['a'][0][0])
			self.orderbook[depth['s']]['asks']['amount']= parseFloat(depth['a'][0][1])
		}
  		
 
	});
	
	
};

BinanceTrade.prototype.trade = function(pair, rate, amount, callback){
	var self = this;
	console.tag("Binance").log(pair+" Entering into trade");
	order(self, pair, rate, amount, (err, data)=>{
		if(!err){
			console.tag("Binance").log(pair+" Order was created: rate "+rate +" amount "+ amount+ " id "+data.orderId);
			setTimeout(function(){
				checkOrder(pair, data.orderId, function(){
					callback();
				});
		
			},1000);
		}else{
			console.tag("Binance").log(err);
		}
	})
	
};

function order(self, pair, rate, amount, callback){
	
	if(self.mode =='buy'){
		binance.buy(pair, amount, rate, {type:'LIMIT'}, callback)
	}else{
		binance.sell(pair, amount, rate, {type:'LIMIT'}, callback)
	}
}

function checkOrder(pair, orderId, callback){
	//called on each iteration
	checkAttempt++;
	if(checkAttempt < maxCheckAttempts){
		if(orderId && orderId !==0){
			//check orders logic here
			binance.openOrders(pair, (err, data, symbol)=>{
				if(!err){
					var activeOrders = [];
					for(order of data){
						activeOrders.push(order.orderId)
					}
					if(activeOrders.indexOf(orderId)>-1){
						setTimeout(function(){
							return	checkOrder(pair, orderId, callback);
						},2000);
					}else{
						console.tag("Binance").log(pair+" Order has been closed");
						//reset check attepmts
						checkAttempt=0;
						return	callback();
					}
				}else{
					console.tag("Binance").log(err);
					setTimeout(function(){
						return	checkOrder(pair, orderId, callback);
					},2000);
				}
			})
		}else{
				console.tag("Binance").log(pair+" Order Executed immidiately");
				//reset check attepmts
				checkAttempt=0;
				return callback();
			}
	}else{
		console.tag("Binance").log(pair+" Max number of checks exceeded. Leaving order");
		//reset check attepmts
		checkAttempt=0;
		return callback();
	}
}


module.exports =BinanceTrade;