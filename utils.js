module.exports = {
	/**
 	* Converts unix time stamp to local date format
 	*/
	timeConverter : function(unixTimeStamp){
		var options = { timeZone: "Europe/London",
								hour12  :false};
		return new Date(unixTimeStamp*1000).toLocaleTimeString("en-US", options);
	},
	
	round: function(val, exp){
		var div =Math.pow(10, exp);
		var rounded =Math.ceil(val*div)/div;
		
		return rounded;
	},
	
	convertExcange: function(id){
		switch(id){
			case 0: return "Polo";
			
			case 1: return "Binance";
			
		}
	},

	matchKeys: function(key1, key2){
		var curr="";
		if(key1.includes("_")){
			curr= key1.split("_")[1]
			
			if(key2.includes(curr)){
				return true;
			}else{
				return false;
			}
		}else{
			curr= key2.split("_")[1]
			
			if(key1.includes(curr)){
				return true;
			}else{
				return false;
			}
		}
	}
	
};