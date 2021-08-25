ARBITRAGE BOT V 0.0.8 GUIDE


****************************************************************************************************
!!! IMPORTANT

-You receive source code AS-IS
-You are solely responsible for any profit and loss
-Cryptocurrency is a very volatile asset class. Do not invest more than you can afford to lose
-DO NOT trade manually on the same accounts where and when bot is working


****************************************************************************************************

Prerequisites
-Watch my video tutorial Cryptocurrency arbitrage bot https://youtu.be/72Kr0QPNqzQ It will help you better understand source code
-Low latency network
-Node.js v8.x


Installation

-Install dependencies with command
	npm install

Configuration

- Generate Binance and Poloniex API keys and secrets and put them into /markets/keys.json file
- Change if needed profit coefficient in manager.js row 9. The default value is 1.004. This coefficient tells bot to trade only when profit is greater or equal than some level (0.4% by default). This coefficient should be greater than combined exchanges fees. In the worst case scenario Poloniex taker fee is 0.2% Binance 0.1%. Minimal value of coefficient should be greater than 1.003
- Bot trades following pairs "ETHBTC","DASHBTC", "LTCBTC","ZECBTC", "ETCBTC", "XMRBTC", "XRPBTC". These pairs are present on both exchanges. If you do not have some aforementioned coins bot will skip them.
- Allocate funds equally on both exchanges. Example

	    | Binance  | Poloniex
	BTC |	50%    |   50%
	ETH |	25%    |   25%
	ZEC |	25%    |   25%

Ideally you should have BTC amount of one exchange sufficient to buy all altcoins from another. 



Launch and monitoring

-Start bot with command 
	node app.js
-Read bots' logs in web browser. URL <BOT_URL>/logs

Hanging orders

-Sometimes do you network delays or exchange performance degradation order may arrive with delay and will not be executed immediately. Bot will track this order 3 hours and will not place any other orders. Then will leave it to hang on exchange and return to normal operation.
