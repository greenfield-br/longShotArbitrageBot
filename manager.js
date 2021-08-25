const poloTrade = require("./markets/PoloTrade");

const binanceTrade = require("./markets/BinanceTrade");

const Balance =  require("./markets/Balance");
const utils = require("./utils");
const console = process.console;

const profitCoeff = 1.004;


//profit counter
var totalProfit =0;

function Manager(){
	this.limits={}
	this.buyBlock = false;
	this.sellBlock = false;
	this.runBlock = true;
	
	
	var poloPairs = ["BTC_ETH","BTC_DASH", "BTC_LTC", "BTC_ZEC","BTC_ETC", "BTC_XMR", "BTC_XRP"];
	var bncPairs = ["ETHBTC","DASHBTC", "LTCBTC","ZECBTC", "ETCBTC", "XMRBTC", "XRPBTC"];

	this.exch = [new poloTrade(poloPairs), new binanceTrade(bncPairs)];
	
	this.balance = new Balance();
	var self= this;
	 this.balance.updateBalance(function(){
	 	self.runBlock = false;
	 	console.tag("Trade").log("runBlock "+self.runBlock);
	 });
	
	
}



Manager.prototype.runBot = function(){
	console.tag("Init").log("Starting bot");
	var self = this;
	for(var i=0; i<self.exch.length; i++){
		self.exch[i].getOrders();
	}
	self.limits = self.exch[1].pairsLimits;
	
	setInterval(function(){
		if(!self.buyBlock && !self.sellBlock&& !self.runBlock){
			compare(self);
		}
	
	},50);

};

function compare(self){
	for (var poloKey in self.exch[0].orderbook){
		
		var bids=[];
		var asks=[];
		var max=0;
		var min=0;
		for (var bncKey in self.exch[1].orderbook){
			if(utils.matchKeys(poloKey, bncKey)){
				bids.push(self.exch[0].orderbook[poloKey]["bids"]["price"])
				bids.push(self.exch[1].orderbook[bncKey]["bids"]["price"])
				asks.push(self.exch[0].orderbook[poloKey]["asks"]["price"])
				asks.push(self.exch[1].orderbook[bncKey]["asks"]["price"])
				max = Math.max.apply(Math, bids);
				min = Math.min.apply(Math,asks);
				

				if(max>0 && min>0 && max>=min*profitCoeff){
					var bidIndex = bids.indexOf(max);
					var askIndex = asks.indexOf(min);

					if(bidIndex !== askIndex){
						//setting modes
						self.exch[bidIndex].mode="sell";
						self.exch[askIndex].mode="buy";
						let sellPair ="";
						let buyPair = "";
						if(bidIndex == 0){
							sellPair = poloKey;
							buyPair = bncKey;
						}else{
							sellPair = bncKey;
							buyPair = poloKey;
						}

						//getting balances
						let buyBalance = self.balance.getBalance(askIndex, 
																buyPair, 
																self.exch[askIndex].mode);
						let sellBalance = self.balance.getBalance(bidIndex, 
																sellPair, 
																self.exch[bidIndex].mode);


						//getting rounding info
						let round = 1;
						for( key in self.limits){
							if(buyPair.includes(key)){
								round = self.limits[key].rounding;
							}
						}
						//calculating trade amount
						let tradeAmount = utils.round(Math.min(self.exch[bidIndex].orderbook[sellPair]["bids"]["amount"], self.exch[askIndex].orderbook[buyPair]["asks"]["amount"]),round);										
						let limitTrade = utils.round(Math.min(sellBalance, buyBalance/min),round);
						
						if(tradeAmount>limitTrade){
							tradeAmount = utils.round(limitTrade,round);
							
						}

						//checking minimun trading amount
						let currLimit =0.001;
						for(let key in self.limits){
							if(buyPair.includes(key)){
								currLimit = self.limits[key].BTCPrice/min;
							}
						}
						if(tradeAmount <=currLimit){
							tradeAmount=utils.round(currLimit*1.0025,round);
						}


					

						if(sellBalance>= tradeAmount && buyBalance >= min* tradeAmount){
						
							console.tag("Trade").log(buyPair+" Sell on "+ 
							utils.convertExcange(bidIndex)+". Price "+max+
							" Buy on "+utils.convertExcange(askIndex)+". Price "+min+" Amount "+ tradeAmount);
							console.tag("Trade").log("Buy Balance "+buyBalance+" sell balance "+sellBalance);
							var profit = (max - min)*tradeAmount*0.996;
							console.tag("Trade").log("Potential profit "+ profit +" BTC");

							//setting blocks
							self.buyBlock =true;
							self.sellBlock =true;
							self.runBlock = true;
							
							self.exch[bidIndex].trade(sellPair, max, tradeAmount, function(){
								self.sellBlock =false;
								console.tag("Trade").log("Sell block "+self.sellBlock);
							});
							self.exch[askIndex].trade(buyPair, min, tradeAmount, function(){
								self.buyBlock =false;
								console.tag("Trade").log("Buy block "+self.buyBlock);
							});
							//updating balance
							var update = setInterval(function(){
								if(!self.sellBlock && !self.buyBlock){
									// setTimeout(function(){
										totalProfit+=profit;
										console.tag("Trade").log("Profit since start "+totalProfit+" BTC");

										self.balance.updateBalance(function(){
											setTimeout(function(){
												self.runBlock = false;
												console.tag("Trade").log("runBlock "+self.runBlock);
											},2000);
										
										});
									
								clearInterval(update);	
								}
							
							}, 500);
							return;
						
						} 
						
					}
				}

			}
		}
	}
}
	




module.exports = Manager;
