import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Configurable data directory (for VPS deployment)
const DATA_DIR = process.env.SPLIT_DATA_DIR || join(process.cwd(), '.split-data');
const SPLITS_FILE = join(DATA_DIR, 'splits.json');

interface Recipient {
  address: string;
  percentage: number;
  name?: string;
}

interface Split {
  id: string;
  name: string;
  description?: string;
  recipients: Recipient[];
  isMutable: boolean;
  creator: string;
  createdAt: string;
}

async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Already exists
  }
}

async function loadSplits(): Promise<Split[]> {
  try {
    const data = await readFile(SPLITS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveSplits(splits: Split[]) {
  await ensureDataDir();
  await writeFile(SPLITS_FILE, JSON.stringify(splits, null, 2));
}

// GET: List splits (all, by creator, or by id)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const creator = searchParams.get('creator');
  const recipient = searchParams.get('recipient');

  const splits = await loadSplits();

  if (id) {
    const split = splits.find((s) => s.id === id);
    if (!split) {
      return NextResponse.json({ error: 'Split not found' }, { status: 404 });
    }
    return NextResponse.json(split);
  }

  if (creator) {
    const creatorSplits = splits.filter(
      (s) => s.creator.toLowerCase() === creator.toLowerCase()
    );
    return NextResponse.json(creatorSplits);
  }

  if (recipient) {
    const recipientSplits = splits.filter((s) =>
      s.recipients.some((r) => r.address.toLowerCase() === recipient.toLowerCase())
    );
    return NextResponse.json(recipientSplits);
  }

  // Return all splits (most recent first)
  return NextResponse.json(splits.slice().reverse().slice(0, 50));
}

// POST: Create a new split
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, recipients, isMutable, creator } = body;

    if (!id || !name || !recipients || recipients.length === 0 || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, recipients, creator' },
        { status: 400 }
      );
    }

    // Validate recipients
    const totalPercentage = recipients.reduce(
      (sum: number, r: Recipient) => sum + r.percentage,
      0
    );
    if (totalPercentage !== 10000) {
      return NextResponse.json(
        { error: 'Percentages must sum to 10000 (100%)' },
        { status: 400 }
      );
    }

    const splits = await loadSplits();

    // Check for duplicate ID
    if (splits.some((s) => s.id === id)) {
      return NextResponse.json({ error: 'Split ID already exists' }, { status: 409 });
    }

    const newSplit: Split = {
      id,
      name: name.trim(),
      description: description?.trim() || undefined,
      recipients,
      isMutable: isMutable ?? false,
      creator,
      createdAt: new Date().toISOString(),
    };

    splits.push(newSplit);
    await saveSplits(splits);

    return NextResponse.json(newSplit, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
