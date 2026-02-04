import express from 'express';
import dotenv from 'dotenv';
import { TwinkleFacilitator } from './Facilitator';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://rpc.ankr.com/eth';

if (!PRIVATE_KEY) {
  console.error('FATAL: FACILITATOR_PRIVATE_KEY is not set.');
  process.exit(1);
}

const facilitator = new TwinkleFacilitator({
  privateKey: PRIVATE_KEY,
  providerUrl: RPC_URL
});

console.log('[Facilitator] Service Initializing...');

app.post('/relay', async (req, res) => {
  try {
    const { intents, meta } = req.body;
    
    if (!intents || !Array.isArray(intents)) {
      res.status(400).json({ error: 'Invalid payload: "intents" array required' });
      return; // Return added here
    }

    console.log(`[Facilitator] Received relay request with ${intents.length} intents`);
    
    // Relay to blockchain
    const result = await facilitator.relayPayment({ intents, meta });
    
    res.json({ status: 'relayed', txHashes: result.txHashes });
  } catch (err: any) {
    console.error('[Facilitator] Relay Failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.send('Twinkle Facilitator: Online');
});

app.listen(PORT, () => {
  console.log(`[Facilitator] Listening on port ${PORT}`);
});
