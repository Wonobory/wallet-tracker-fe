# API Documentation for Crypto Wealth Tracker

Since the dashboard is currently using mock data, here is the documentation for the API calls needed to fetch real data for wallets and DEX positions.

## Wallets

For each wallet source, you need to query the balance from the respective blockchain.

### Ethereum
- **API**: Etherscan API or Infura
- **Endpoint**: `https://api.etherscan.io/api?module=account&action=balance&address={address}&tag=latest&apikey={API_KEY}`
- **Method**: GET
- **Response**: Balance in Wei, convert to ETH
- **API Key**: Required, get from Etherscan

### Bitcoin
- **API**: BlockCypher API
- **Endpoint**: `https://api.blockcypher.com/v1/btc/main/addrs/{address}/balance`
- **Method**: GET
- **Response**: Balance in Satoshis
- **API Key**: Optional, but recommended for higher limits

### Solana
- **API**: Solana RPC or Helius
- **Endpoint**: POST to `https://api.mainnet-beta.solana.com` with JSON: `{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["{address}"]}`
- **Response**: Balance in Lamports

Add more chains as needed.

## DEXes

For DEX sources, use their APIs to get user positions and balances. API keys are required for authentication.

### Hyperliquid
- **API**: Hyperliquid REST API
- **Base URL**: `https://api.hyperliquid.xyz`
- **Endpoint**: POST `/info`
- **Body**: `{"type": "clearinghouseState", "user": "{user_address}"}` (user address derived from API key?)
- **Headers**: Include API key in headers or as per docs
- **Response**: User state including positions and balances
- **Docs**: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api

### Paradex
- **API**: Paradex API (on Starknet)
- **Base URL**: Check their docs, probably `https://api.paradex.trade`
- **Endpoints**: For positions, `/v1/account/positions`
- **Auth**: Use API key
- **Docs**: Search for Paradex API documentation

### Lighter
- **API**: Lighter API
- **Base URL**: `https://api.lighter.xyz` or similar
- **Endpoints**: For balance, `/v1/balances`
- **Auth**: API key
- **Docs**: Check Lighter's developer docs

## General Notes
- For wealth progression, you may need historical data. Some APIs provide historical balances, or you can store snapshots over time.
- Handle rate limits and errors.
- For total wealth, sum balances from all sources, convert to USD using price APIs like CoinGecko.
- Implement caching to avoid excessive API calls.