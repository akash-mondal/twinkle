/**
 * Twinkle SDK Configuration
 */

export interface ContractAddresses {
    TwinkleCore: `0x${string}`;
    TwinklePay: `0x${string}`;
    TwinkleSplit: `0x${string}`;
    TwinkleEscrow: `0x${string}`;
    TwinkleSubscription: `0x${string}`;
    TwinkleX402: `0x${string}`;
    MNEE: `0x${string}`;
    SablierLockup: `0x${string}`;
}

export const MAINNET_CONTRACTS: ContractAddresses = {
    TwinkleCore: '0x68Ab986EBd3A3307E04b0384fB483e528D16D013',
    TwinklePay: '0xa3DB430aFD3e92b4991842A3D167E8487E9a8bFF',
    TwinkleSplit: '0xDEe5671FcFC26207295E4352E8bDf6785519e4EF',
    TwinkleEscrow: '0x19AF229901db0ae11fafc536606b592a3524e28d',
    TwinkleSubscription: '0x902E0D39D872b3CD1f7d82bb4Ee8beBd7b045Ff8',
    TwinkleX402: '0x348356f71539CCc13695a4868541B9bC18764A0F',
    MNEE: '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF',
    SablierLockup: '0xcF8ce57fa442ba50aCbC57147a62aD03873FfA73',
};

export const SEPOLIA_CONTRACTS: ContractAddresses = {
    TwinkleCore: '0x902E0D39D872b3CD1f7d82bb4Ee8beBd7b045Ff8',
    TwinklePay: '0x348356f71539CCc13695a4868541B9bC18764A0F',
    TwinkleSplit: '0xdF74B5bAf4F9F85AdE8dFc8F19D5cF47F3b14aA2',
    TwinkleEscrow: '0x57526eBA750E9E216955f7Ea89917c759169016c',
    TwinkleSubscription: '0x8ABb57F7a5d74C0B54aF030A7988a5dD18fC4907',
    TwinkleX402: '0x1EDc124D1608Cca16F7B27B4027EFaF40AE3BC62',
    MNEE: '0xDEe5671FcFC26207295E4352E8bDf6785519e4EF', // TestMNEE
    SablierLockup: '0x6b0307b4338f2963A62106028E3B074C2c0510DA',
};

export interface TwinkleConfig {
    chainId: number;
    rpcUrl: string;
    apiUrl: string;
    contracts: ContractAddresses;
}

// Default configuration (Mainnet)
export const DEFAULT_CONFIG: TwinkleConfig = {
    chainId: 1,
    rpcUrl: 'https://ethereum.publicnode.com',
    apiUrl: 'https://twinkle-api.railway.app', // Placeholder, user should override
    contracts: MAINNET_CONTRACTS,
};

// Global singleton for configuration
export let SDK_CONFIG = { ...DEFAULT_CONFIG };

/**
 * Initialize the Twinkle SDK with custom configuration
 */
export function initTwinkle(config: Partial<TwinkleConfig>) {
    SDK_CONFIG = { ...SDK_CONFIG, ...config };

    // Auto-select contracts if chainId changes but contracts aren't provided
    if (config.chainId && !config.contracts) {
        if (config.chainId === 11155111) {
            SDK_CONFIG.contracts = SEPOLIA_CONTRACTS;
        } else if (config.chainId === 1) {
            SDK_CONFIG.contracts = MAINNET_CONTRACTS;
        }
    }
}
