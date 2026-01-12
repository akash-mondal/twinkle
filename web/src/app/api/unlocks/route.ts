import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// File-based storage - configurable via environment variable for VPS deployment
const DATA_DIR = process.env.PASTE_DATA_DIR || join(process.cwd(), '.paste-data');
const DATA_FILE = join(DATA_DIR, 'unlocks.json');

interface Unlock {
  pasteId: string;
  user: string;
  unlockedAt: string;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify({ unlocks: [] }));
  }
}

function readUnlocks(): Unlock[] {
  ensureDataDir();
  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data).unlocks || [];
  } catch {
    return [];
  }
}

function writeUnlocks(unlocks: Unlock[]) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify({ unlocks }, null, 2));
}

// GET - Get unlocks for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  const pasteId = searchParams.get('pasteId');

  const unlocks = readUnlocks();

  // Check if specific user has unlocked specific paste
  if (user && pasteId) {
    const hasUnlocked = unlocks.some(
      (u) => u.user.toLowerCase() === user.toLowerCase() && u.pasteId === pasteId
    );
    return NextResponse.json({ unlocked: hasUnlocked });
  }

  // Get all unlocks for a user
  if (user) {
    const userUnlocks = unlocks.filter((u) => u.user.toLowerCase() === user.toLowerCase());
    return NextResponse.json(userUnlocks);
  }

  return NextResponse.json({ error: 'Missing user parameter' }, { status: 400 });
}

// POST - Record an unlock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pasteId, user } = body;

    if (!pasteId || !user) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const unlocks = readUnlocks();

    // Check if already unlocked
    const existing = unlocks.find(
      (u) => u.user.toLowerCase() === user.toLowerCase() && u.pasteId === pasteId
    );

    if (existing) {
      return NextResponse.json({ message: 'Already unlocked' });
    }

    const newUnlock: Unlock = {
      pasteId,
      user,
      unlockedAt: new Date().toISOString(),
    };

    unlocks.push(newUnlock);
    writeUnlocks(unlocks);

    return NextResponse.json(newUnlock, { status: 201 });
  } catch (error) {
    console.error('Error recording unlock:', error);
    return NextResponse.json({ error: 'Failed to record unlock' }, { status: 500 });
  }
}
