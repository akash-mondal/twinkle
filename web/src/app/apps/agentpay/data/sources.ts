/**
 * Data Source Definitions for AgentPay
 * Each source corresponds to a crypto API tool
 */

import {
  Bitcoin,
  TrendingUp,
  Sparkles,
  LineChart,
  Info,
  Droplets,
  ArrowLeftRight,
  Fuel,
  DollarSign,
  Globe,
  BarChart3,
  Gauge,
  PieChart,
  Image,
  type LucideIcon,
} from 'lucide-react';

export interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  toolName: string;
  api: string;
  color: string;
}

export const dataSources: DataSource[] = [
  {
    id: 'price',
    name: 'Live Prices',
    description: 'BTC, ETH, SOL real-time',
    icon: Bitcoin,
    toolName: 'get_price',
    api: 'CoinGecko',
    color: '#F7931A',
  },
  {
    id: 'markets',
    name: 'Market Data',
    description: 'Top 100 by market cap',
    icon: TrendingUp,
    toolName: 'get_markets',
    api: 'CoinGecko',
    color: '#00D4AA',
  },
  {
    id: 'trending',
    name: 'Trending Now',
    description: 'Hot coins in 24 hours',
    icon: Sparkles,
    toolName: 'get_trending',
    api: 'CoinGecko',
    color: '#FF6B6B',
  },
  {
    id: 'history',
    name: 'Price History',
    description: '7/30/90 day charts',
    icon: LineChart,
    toolName: 'get_history',
    api: 'CoinGecko',
    color: '#4ECDC4',
  },
  {
    id: 'token',
    name: 'Token Info',
    description: 'Detailed coin data',
    icon: Info,
    toolName: 'get_token',
    api: 'CoinGecko',
    color: '#9B59B6',
  },
  {
    id: 'pools',
    name: 'DEX Pools',
    description: 'Top liquidity pools',
    icon: Droplets,
    toolName: 'get_pools',
    api: 'GeckoTerminal',
    color: '#3498DB',
  },
  {
    id: 'trades',
    name: 'DEX Trades',
    description: 'Recent swap activity',
    icon: ArrowLeftRight,
    toolName: 'get_trades',
    api: 'GeckoTerminal',
    color: '#E74C3C',
  },
  {
    id: 'gas',
    name: 'Gas Prices',
    description: 'ETH gas in Gwei',
    icon: Fuel,
    toolName: 'get_gas',
    api: 'Etherscan',
    color: '#F39C12',
  },
  {
    id: 'btc',
    name: 'BTC Index',
    description: 'Bitcoin Price Index',
    icon: DollarSign,
    toolName: 'get_btc',
    api: 'CoinDesk',
    color: '#F7931A',
  },
  {
    id: 'rates',
    name: 'Exchange Rates',
    description: 'BTC in fiat currencies',
    icon: Globe,
    toolName: 'get_rates',
    api: 'Blockchain.com',
    color: '#1ABC9C',
  },
  {
    id: 'eth_stats',
    name: 'ETH Stats',
    description: 'Network statistics',
    icon: BarChart3,
    toolName: 'get_eth_stats',
    api: 'CoinGecko',
    color: '#627EEA',
  },
  {
    id: 'sentiment',
    name: 'Fear & Greed',
    description: 'Market sentiment index',
    icon: Gauge,
    toolName: 'get_sentiment',
    api: 'Alternative.me',
    color: '#2ECC71',
  },
  {
    id: 'global',
    name: 'Global Stats',
    description: 'Total market cap',
    icon: PieChart,
    toolName: 'get_global',
    api: 'CoinGecko',
    color: '#8E44AD',
  },
  {
    id: 'nfts',
    name: 'NFT Trending',
    description: 'Hot NFT collections',
    icon: Image,
    toolName: 'get_nfts',
    api: 'CoinGecko',
    color: '#E056FD',
  },
];

// Map tool names to source IDs for quick lookup
export const toolToSource: Record<string, DataSource> = dataSources.reduce(
  (acc, source) => {
    acc[source.toolName] = source;
    return acc;
  },
  {} as Record<string, DataSource>
);

// Get source by ID
export function getSourceById(id: string): DataSource | undefined {
  return dataSources.find((s) => s.id === id);
}

// Get source by tool name
export function getSourceByTool(toolName: string): DataSource | undefined {
  return toolToSource[toolName];
}
