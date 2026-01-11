# Twinkle Protocol - Smart Contracts

Twinkle is payment infrastructure for AI agents implementing the x402 payment protocol. These smart contracts handle payments, escrows, splits, subscriptions, and HTTP 402 paywalls.

## Contract Addresses

### Ethereum Mainnet (Chain ID: 1)

| Contract | Address |
|----------|---------|
| TwinkleCore | `0x1ca179Ef926bECa70680F7a7E4C12bF3D0Deb92c` |
| TwinklePay | `0xb06A5210F981241467383B25D02983C19263D519` |
| TwinkleSplit | `0x6dde461dd5DA6D458394364915bF9d519445644C` |
| TwinkleEscrow | `0xF730d47c3003eCaE2608C452BCD5b0edf825e51C` |
| TwinkleSubscription | `0x5801a405f42A86d66d17df7662911da89e8b0A08` |
| TwinkleX402 | `0x7BF61F6325E9e8DceB710aeDb817004d71908957` |
| MNEE (External) | `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF` |
| Sablier V3 Lockup (External) | `0xcF8ce57fa442ba50aCbC57147a62aD03873FfA73` |

### Sepolia Testnet (Chain ID: 11155111)

| Contract | Address |
|----------|---------|
| TwinkleCore | `0x0DF0E3024350ea0992a7485aDbDE425a79983c09` |
| TwinklePay | `0xAE1a483ce67a796FcdC7C986CbB556f2975bE190` |
| TwinkleSplit | `0x987c621118D66A1F58C032EBdDe8F4f3385B71E4` |
| TwinkleEscrow | `0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931` |
| TwinkleSubscription | `0xa4436C50743FF1eD0C38318A32F502b2A5F899E6` |
| TwinkleX402 | `0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3` |
| TestMNEE | `0xF730d47c3003eCaE2608C452BCD5b0edf825e51C` |
| Sablier V3 Lockup (External) | `0x6b0307b4338f2963A62106028E3B074C2c0510DA` |

## Getting TestMNEE (Sepolia)

TestMNEE is a test token for development on Sepolia. To get TestMNEE:

1. **Mint directly** - TestMNEE has public minting enabled:
   ```bash
   # Using cast
   cast send 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C \
     "mint(address,uint256)" \
     <YOUR_ADDRESS> \
     1000000000000000000000 \
     --rpc-url https://ethereum-sepolia.publicnode.com \
     --private-key <YOUR_PRIVATE_KEY>
   ```
   This mints 1000 TestMNEE (18 decimals).

2. **Check balance**:
   ```bash
   cast call 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C \
     "balanceOf(address)" \
     <YOUR_ADDRESS> \
     --rpc-url https://ethereum-sepolia.publicnode.com
   ```

## Contracts Overview

### TwinkleCore
Central registry and configuration hub. Manages:
- Contract registration
- Fee settings
- Treasury address
- MNEE token reference
- Sablier integration for streaming

### TwinklePay
Simple direct payments:
- One-time MNEE transfers
- Payment tracking with request IDs
- Fee collection

### TwinkleSplit
Revenue splitting:
- Define multiple recipients with percentages
- Automatic distribution on payment
- Useful for royalties and revenue sharing

### TwinkleEscrow
Time-locked payments:
- Milestone-based releases
- Refund capabilities
- Sablier streaming integration for gradual release

### TwinkleSubscription
Recurring payments:
- Create subscription plans
- Automatic renewals
- Grace periods and cancellation

### TwinkleX402
HTTP 402 paywall protocol:
- EIP-712 signed payment intents
- Facilitator-mediated settlements
- Paywall verification for web resources

## Development

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Build
```bash
forge build
```

### Test
```bash
forge test
```

### Deploy to Sepolia
```bash
forge script script/DeployTwinkle.s.sol:DeployTwinkle \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

### Deploy to Mainnet
```bash
forge script script/DeployMainnet.s.sol:DeployMainnet \
  --rpc-url $ETH_RPC_URL \
  --broadcast \
  --verify
```

## Environment Variables

```bash
# Private key for deployment
PRIVATE_KEY=0x...

# Treasury address for fee collection
TREASURY_ADDRESS=0x...

# Facilitator address for x402
FACILITATOR_ADDRESS=0x...

# RPC URLs
SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Etherscan API key for verification
ETHERSCAN_API_KEY=...
```

## External Dependencies

- **MNEE**: Stablecoin token used for all payments
- **Sablier V3**: Token streaming protocol for escrow and subscriptions

## License

MIT
