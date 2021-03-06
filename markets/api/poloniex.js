module.exports = (function() {
    "use strict";

    // Module dependencies
    var crypto  = require("crypto"),
        request = require("request"),
        nonce   = require("nonce")();

    // Constants
    var version         = "0.0.6",
        PUBLIC_API_URL  = "https://poloniex.com/public",
        PRIVATE_API_URL = "https://poloniex.com/tradingApi",
        USER_AGENT      = "poloniex.js " + version;
        //USER_AGENT    = 'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0'

    

    // Constructor
    function Poloniex(key, secret) {
        // Generate headers signed by this user's key and secret.
        // The secret is encapsulated and never exposed
        this._getPrivateHeaders = function(parameters) {
            var paramString, signature;

            if (!key || !secret) {
                throw "Poloniex: Error. API key and secret required";
            }

            // Convert to `arg1=foo&arg2=bar`
            paramString = Object.keys(parameters).map(function(param) {
                return encodeURIComponent(param) + "=" + encodeURIComponent(parameters[param]);
            }).join("&");

            signature = crypto.createHmac("sha512", secret).update(paramString).digest("hex");

            return {
                Key: key,
                Sign: signature
            };
        };
    }

    // Currently, this fails with `Error: CERT_UNTRUSTED`
    // Poloniex.STRICT_SSL can be set to `false` to avoid this. Use with caution.
    // Will be removed in future, once this is resolved.
    Poloniex.STRICT_SSL = true;

    // Customisable user agent string
    Poloniex.USER_AGENT = USER_AGENT;

    // Prototype
    Poloniex.prototype = {
        constructor: Poloniex,

        // Make an API request
        _request: function(options, callback) {
            if (!("headers" in options)) {
                options.headers = {};
            }

            options.json = true;
            options.headers["User-Agent"] = Poloniex.USER_AGENT;
            options.strictSSL = Poloniex.STRICT_SSL;

            request(options, function(err, response, body) {
		    // Empty response
		    if (!err && (typeof body === "undefined" || body === null)){
			err = "Empty response";
		    }
		    callback(err, body);
		});

            return this;
        },

        // Make a public API request
        _public: function(command, parameters, callback) {
            var options;

            if (typeof parameters === "function") {
                callback = parameters;
                parameters = {};
            }

            parameters || (parameters = {});
            parameters.command = command;
            options = {
                method: "GET",
                url: PUBLIC_API_URL,
                qs: parameters
            };
            options.qs.command = command;
            return this._request(options, callback);
        },

        // Make a private API request
        _private: function(command, parameters, callback) {
            var options;

            if (typeof parameters === "function") {
                callback = parameters;
                parameters = {};
            }

            parameters || (parameters = {});
            parameters.command = command;
            parameters.nonce = nonce();

            options = {
                method: "POST",
                url: PRIVATE_API_URL,
                form: parameters,
                headers: this._getPrivateHeaders(parameters)
            };

            return this._request(options, callback);
        },

        /////
        // PUBLIC METHODS

        returnTicker: function(callback) {
            return this._public("returnTicker", callback);
        },

        return24hVolume: function(callback) {
            return this._public("return24hVolume", callback);
        },

        returnOrderBook: function(pair, depth, callback) {
            var parameters = {
		currencyPair: pair,
		depth : depth
	    };

            return this._public("returnOrderBook", parameters, callback);
        },

        returnChartData: function(pair, period, start, end, callback) {
            var parameters = {
                currencyPair: pair,
		period: period,
		start: start,
		end: end
            };

            return this._public("returnChartData", parameters, callback);
        },

        returnCurrencies: function(callback) {
            return this._public("returnCurrencies", callback);
        },

        returnLoanOrders: function(currency, callback) {
            return this._public("returnLoanOrders", {currency: currency}, callback);
        },

        /////
        // PRIVATE METHODS

        returnBalances: function(callback) {
            return this._private("returnBalances", {}, callback);
        },

	returnCompleteBalances: function(callback) {
            return this._private("returnCompleteBalances", {}, callback);
        },

        returnDepositAddresses: function(callback) {
            return this._private("returnDepositAddresses", {}, callback);
        },

        generateNewAddress: function(currency, callback) {
            return this._private("returnDepositsWithdrawals", {currency: currency}, callback);
        },

        returnDepositsWithdrawals: function(start, end, callback) {
            return this._private("returnDepositsWithdrawals", {start: start, end: end}, callback);
        },

        returnOpenOrders: function(pair, callback) {
            var parameters = {
		currencyPair: pair
	    };

            return this._private("returnOpenOrders", parameters, callback);
        },

        returnTradeHistory: function(pair, start, callback) {
            var parameters = {
		currencyPair: pair,
		start: start
	    };

            return this._public("returnTradeHistory", parameters, callback);
        },

        returnOrderTrades: function(orderNumber, callback) {
            var parameters = {
		orderNumber: orderNumber
	    };

            return this._private("returnOrderTrades", parameters, callback);
        },

        buy: function(pair, rate, amount, callback) {
            var parameters = {
		currencyPair: pair,
		rate: rate,
		amount: amount
	    };

            return this._private("buy", parameters, callback);
        },

        sell: function(pair, rate, amount, callback) {
            var parameters = {
		currencyPair: pair,
		rate: rate,
		amount: amount
	    };

            return this._private("sell", parameters, callback);
        },
        
        trade: function (params, callback){
        	if(params["type"]==="buy"){
        		this.buy(params["pair"], params["rate"], params["amount"], callback);
        	}else{
        		this.sell(params["pair"], params["rate"], params["amount"], callback);
        	}
        },

        cancelOrder: function(pair, orderNumber, callback) {
            var parameters = {
		currencyPair: pair,
		orderNumber: orderNumber
	    };

            return this._private("cancelOrder", parameters, callback);
        },

        moveOrder: function(orderNumber, rate, amount, callback) {
            var parameters = {
                orderNumber: orderNumber,
		rate: rate,
		amount: amount ? amount : null
            };

            return this._private("moveOrder", parameters, callback);
        },

        withdraw: function(currency, amount, address, callback) {
            var parameters = {
		currency: currency,
		amount: amount,
		address: address
	    };

            return this._private("withdraw", parameters, callback);
        },

        returnFeeInfo: function(callback) {
            return this._private("returnFeeInfo", {}, callback);
        },

        returnAvailableAccountBalances: function(account, callback) {
	    var options = {};
	    if (account) {
		options.account = account;
	    }
            return this._private("returnAvailableAccountBalances", options, callback);
        },

        returnTradableBalances: function(callback) {
            return this._private("returnTradableBalances", {}, callback);
        },

        transferBalance: function(currency, amount, fromAccount, toAccount, callback) {
            var parameters = {
                currency: currency,
		amount: amount,
		fromAccount: fromAccount,
		toAccount: toAccount
            };

            return this._private("transferBalance", parameters, callback);
        },

        returnMarginAccountSummary: function(callback) {
            return this._private("returnMarginAccountSummary", {}, callback);
        },

        marginBuy: function(pair, rate, amount, lendingRate, callback) {
            var parameters = {
                currencyPair: pair,
		rate: rate,
		amount: amount,
		lendingRate: lendingRate ? lendingRate : null
            };

            return this._private("marginBuy", parameters, callback);
        },

        marginSell: function(pair, rate, amount, lendingRate, callback) {
            var parameters = {
                currencyPair: pair,
		rate: rate,
		amount: amount,
		lendingRate: lendingRate ? lendingRate : null
            };

            return this._private("marginSell", parameters, callback);
        },

        getMarginPosition: function(pair, callback) {
            var parameters = {
                currencyPair: pair
            };

            return this._private("getMarginPosition", parameters, callback);
        },

        closeMarginPosition: function(pair, callback) {
            var parameters = {
                currencyPair: jpair
            };

            return this._private("closeMarginPosition", parameters, callback);
        },

        createLoanOffer: function(currency, amount, duration, autoRenew, lendingRate, callback) {
            var parameters = {
                currency: currency,
                amount: amount,
                duration: duration,
		autoRenew: autoRenew,
		lendingRate: lendingRate
            };

            return this._private("createLoanOffer", parameters, callback);
        },

        cancelLoanOffer: function(orderNumber, callback) {
            var parameters = {
                orderNumber: orderNumber
            };

            return this._private("cancelLoanOffer", parameters, callback);
        },

        returnOpenLoanOffers: function(callback) {
            return this._private("returnOpenLoanOffers", {}, callback);
        },

	returnActiveLoans: function(callback) {
            return this._private("returnActiveLoans", {}, callback);
        },

	toggleAutoRenew: function(orderNumber, callback) {
            return this._private("toggleAutoRenew", {orderNumber: orderNumber}, callback);
        }

    };

    // Backwards Compatibility
    Poloniex.prototype.getTicker = Poloniex.prototype.returnTicker;
    Poloniex.prototype.get24hVolume = Poloniex.prototype.return24hVolume;
    Poloniex.prototype.getOrderBook = Poloniex.prototype.returnOrderBook;
    Poloniex.prototype.getTradeHistory = Poloniex.prototype.returnChartData;
    Poloniex.prototype.myBalances = Poloniex.prototype.returnBalances;
    Poloniex.prototype.myOpenOrders = Poloniex.prototype.returnOpenOrders;
    Poloniex.prototype.myTradeHistory = Poloniex.prototype.returnTradeHistory;

    return Poloniex;
})();
