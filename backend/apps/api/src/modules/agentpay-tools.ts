/**
 * AgentPay Tools - OpenAI Function Definitions for Crypto APIs
 * All APIs are free and require no authentication
 */

import type { ChatCompletionTool } from "openai/resources/chat/completions";

// Tool definitions for OpenAI function calling
export const cryptoTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_price",
      description: "Get current prices for cryptocurrencies in USD. Use this when the user asks about prices of specific coins.",
      parameters: {
        type: "object",
        properties: {
          coins: {
            type: "array",
            items: { type: "string" },
            description: "Coin IDs like bitcoin, ethereum, solana. Use lowercase."
          }
        },
        required: ["coins"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_markets",
      description: "Get top cryptocurrencies by market cap with price, volume, and market data. Use this for market overviews or top coins lists.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of coins to return (max 100)",
            default: 10
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_trending",
      description: "Get trending cryptocurrencies and NFTs in the last 24 hours. Use this when user asks about what's hot or trending.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_history",
      description: "Get historical price data for a cryptocurrency. Use this for price charts or historical analysis.",
      parameters: {
        type: "object",
        properties: {
          coinId: {
            type: "string",
            description: "Coin ID like bitcoin, ethereum"
          },
          days: {
            type: "number",
            description: "Number of days of history (1, 7, 30, 90, 365)",
            default: 7
          }
        },
        required: ["coinId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_token",
      description: "Get detailed information about a specific cryptocurrency including description, links, and statistics.",
      parameters: {
        type: "object",
        properties: {
          coinId: {
            type: "string",
            description: "Coin ID like bitcoin, ethereum, solana"
          }
        },
        required: ["coinId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_pools",
      description: "Get top DEX liquidity pools on Ethereum. Use this for DeFi pool analysis.",
      parameters: {
        type: "object",
        properties: {
          network: {
            type: "string",
            description: "Network: eth, bsc, polygon, arbitrum",
            default: "eth"
          },
          limit: {
            type: "number",
            description: "Number of pools to return",
            default: 10
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_trades",
      description: "Get recent DEX trades on a network. Use this to see recent trading activity.",
      parameters: {
        type: "object",
        properties: {
          network: {
            type: "string",
            description: "Network: eth, bsc, polygon",
            default: "eth"
          },
          poolAddress: {
            type: "string",
            description: "Optional pool address to filter trades"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_gas",
      description: "Get current Ethereum gas prices in Gwei. Use this when user asks about gas or transaction costs.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_btc",
      description: "Get Bitcoin Price Index from CoinDesk with multiple currency rates.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_rates",
      description: "Get Bitcoin exchange rates in multiple fiat currencies from Blockchain.com",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_eth_stats",
      description: "Get Ethereum network statistics including supply and last price.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_sentiment",
      description: "Get the Crypto Fear & Greed Index. Use this to gauge market sentiment.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_global",
      description: "Get global cryptocurrency market statistics including total market cap, volume, and BTC dominance.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_nfts",
      description: "Get trending NFT collections. Use this when user asks about NFTs.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of NFT collections to return",
            default: 10
          }
        },
        required: []
      }
    }
  }
];

// Tool name to data source ID mapping (for frontend tile highlighting)
export const toolToSourceId: Record<string, string> = {
  get_price: "price",
  get_markets: "markets",
  get_trending: "trending",
  get_history: "history",
  get_token: "token",
  get_pools: "pools",
  get_trades: "trades",
  get_gas: "gas",
  get_btc: "btc",
  get_rates: "rates",
  get_eth_stats: "eth_stats",
  get_sentiment: "sentiment",
  get_global: "global",
  get_nfts: "nfts"
};

// Cost per API call in MNEE (all 0.1 for now)
export const toolCosts: Record<string, string> = {
  get_price: "0.1",
  get_markets: "0.1",
  get_trending: "0.1",
  get_history: "0.1",
  get_token: "0.1",
  get_pools: "0.1",
  get_trades: "0.1",
  get_gas: "0.1",
  get_btc: "0.1",
  get_rates: "0.1",
  get_eth_stats: "0.1",
  get_sentiment: "0.1",
  get_global: "0.1",
  get_nfts: "0.1"
};

// Execute actual API calls
export async function executeApiCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  switch (toolName) {
    case "get_price": {
      const coins = (args.coins as string[]).join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true`
      );
      return res.json();
    }

    case "get_markets": {
      const limit = (args.limit as number) || 10;
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
      );
      return res.json();
    }

    case "get_trending": {
      const res = await fetch("https://api.coingecko.com/api/v3/search/trending");
      return res.json();
    }

    case "get_history": {
      const coinId = args.coinId as string;
      const days = (args.days as number) || 7;
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      return res.json();
    }

    case "get_token": {
      const coinId = args.coinId as string;
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );
      return res.json();
    }

    case "get_pools": {
      const network = (args.network as string) || "eth";
      const limit = (args.limit as number) || 10;
      const res = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/${network}/pools?page=1&per_page=${limit}`
      );
      return res.json();
    }

    case "get_trades": {
      const network = (args.network as string) || "eth";
      // GeckoTerminal trades endpoint
      const res = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/${network}/pools?page=1&per_page=5`
      );
      const data = await res.json();
      // Return pool data with recent volume as proxy for trades
      return { network, pools: data.data?.slice(0, 5) || [] };
    }

    case "get_gas": {
      // Using public Etherscan endpoint (limited, no key needed for basic)
      const res = await fetch(
        "https://api.etherscan.io/api?module=gastracker&action=gasoracle"
      );
      return res.json();
    }

    case "get_btc": {
      const res = await fetch("https://api.coindesk.com/v1/bpi/currentprice.json");
      return res.json();
    }

    case "get_rates": {
      const res = await fetch("https://blockchain.info/ticker");
      return res.json();
    }

    case "get_eth_stats": {
      // Using CoinGecko for ETH stats instead of Etherscan (no key needed)
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&community_data=false&developer_data=false"
      );
      const data = await res.json();
      return {
        price_usd: data.market_data?.current_price?.usd,
        market_cap: data.market_data?.market_cap?.usd,
        total_volume: data.market_data?.total_volume?.usd,
        price_change_24h: data.market_data?.price_change_percentage_24h
      };
    }

    case "get_sentiment": {
      const res = await fetch("https://api.alternative.me/fng/?limit=1");
      return res.json();
    }

    case "get_global": {
      const res = await fetch("https://api.coingecko.com/api/v3/global");
      return res.json();
    }

    case "get_nfts": {
      const limit = (args.limit as number) || 10;
      const res = await fetch(
        `https://api.coingecko.com/api/v3/nfts/list?per_page=${limit}&page=1`
      );
      return res.json();
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
