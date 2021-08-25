

const fs = require('fs');
const keys = JSON.parse(fs.readFileSync(__dirname+'/keys.json', 'utf8'));

const POLO = require("./api/poloniex");
const polo = new POLO(keys["poloniex"]["key"], keys["poloniex"]["secret"]);


const BNC = require('node-binance-api');
const binance = new BNC().options({
  APIKEY: keys["binance"]["key"],
  APISECRET: keys["binance"]["secret"],
  useServerTime: true, 
  test: false // If you want to use sandbox mode where orders are simulated
});



var console = process.console;
function Balance(){
	
	this.balanceMatrix = {
		polo:{},
		binance:{},
		
		
	};
}

Balance.prototype.updateBalance = function(callback){
	var self = this;
		console.log("Requesting balances");
		//requesting poloniex balance
		polo.returnBalances(function(err, data){
			console.tag("Init").log("Requesting balance on Poloniex");
			if(!err){
				self.balanceMatrix.polo = data;
				
				binance.balance((err, balances) => {
					console.tag("Init").log("Requesting balance on Binance");
					if(!err){
						let balance = {}
						for(elem in balances){
							balance[elem] =balances[elem]['available']
						}
						self.balanceMatrix.binance = balance;
						console.tag("Init").log(self.balanceMatrix)
						
						callback()
					}else{
						console.log(err)
					}
				 
				});
						
								
								
						
						
					
			}else{
			 console.log(err.toString());
			 }
		});
	
};

Balance.prototype.getBalance = function(exchange, pair, mode){
	
	var curr="";
	switch(exchange){
		case 0:
			switch(mode){
				case "buy":
					curr =pair.split("_")[0];
				break;

				case "sell":
					curr =pair.split("_")[1];
				break;
			}
		return parseFloat(this.balanceMatrix.polo[curr]) || 0;
	
		case 1:
			switch(mode){
				case "buy":
					if(pair.length === 6){
						curr =pair.substr(3);
					}else{
						curr =pair.substr(4);
					}
					
				break;
				case "sell":
					if(pair.length === 6){
						curr =pair.substr(0,3);
					}else{
						curr =pair.substr(0,4);
					}
				break;
			}
		return parseFloat(this.balanceMatrix.binance[curr]) || 0;
		
	}
	
};
module.exports = Balance;