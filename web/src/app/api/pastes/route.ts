import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// File-based storage - configurable via environment variable for VPS deployment
// In production, consider using a database for better scalability
const DATA_DIR = process.env.PASTE_DATA_DIR || path.join(process.cwd(), '.paste-data');
const DATA_FILE = path.join(DATA_DIR, 'pastes.json');

interface Paste {
  id: string;
  content: string;
  title: string;
  price: string;
  creator: string;
  createdAt: number;
  contentType?: string;
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
}

async function readPastes(): Promise<Record<string, Paste>> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

async function writePastes(pastes: Record<string, Paste>) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(pastes, null, 2));
}

// GET all pastes or specific paste
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const creator = searchParams.get('creator');

  const pastes = await readPastes();

  if (id) {
    const paste = pastes[id];
    if (!paste) {
      return NextResponse.json({ error: 'Paste not found' }, { status: 404 });
    }
    return NextResponse.json(paste);
  }

  if (creator) {
    const creatorPastes = Object.values(pastes)
      .filter((p) => p.creator.toLowerCase() === creator.toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json(creatorPastes);
  }

  // Return recent pastes (for home page)
  const recentPastes = Object.values(pastes)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20);
  return NextResponse.json(recentPastes);
}

// POST create new paste
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, title, price, creator, contentType } = body;

    if (!id || !content || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields: id, content, creator' },
        { status: 400 }
      );
    }

    const pastes = await readPastes();

    // Check if ID already exists
    if (pastes[id]) {
      return NextResponse.json(
        { error: 'Paste ID already exists' },
        { status: 409 }
      );
    }

    const paste: Paste = {
      id,
      content,
      title: title || 'Untitled',
      price: price || '0',
      creator,
      createdAt: Date.now(),
      contentType: contentType || 'plain',
    };

    pastes[id] = paste;
    await writePastes(pastes);

    return NextResponse.json(paste, { status: 201 });
  } catch (e) {
    console.error('Error creating paste:', e);
    return NextResponse.json(
      { error: 'Failed to create paste' },
      { status: 500 }
    );
  }
}

// PUT update paste (only by creator)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, title, creator } = body;

    if (!id || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields: id, creator' },
        { status: 400 }
      );
    }

    const pastes = await readPastes();
    const paste = pastes[id];

    if (!paste) {
      return NextResponse.json({ error: 'Paste not found' }, { status: 404 });
    }

    // Verify ownership
    if (paste.creator.toLowerCase() !== creator.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Update fields
    if (content !== undefined) paste.content = content;
    if (title !== undefined) paste.title = title;

    pastes[id] = paste;
    await writePastes(pastes);

    return NextResponse.json(paste);
  } catch (e) {
    console.error('Error updating paste:', e);
    return NextResponse.json(
      { error: 'Failed to update paste' },
      { status: 500 }
    );
  }
}

// DELETE paste (only by creator)
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const creator = searchParams.get('creator');

  if (!id || !creator) {
    return NextResponse.json(
      { error: 'Missing required params: id, creator' },
      { status: 400 }
    );
  }

  const pastes = await readPastes();
  const paste = pastes[id];

  if (!paste) {
    return NextResponse.json({ error: 'Paste not found' }, { status: 404 });
  }

  // Verify ownership
  if (paste.creator.toLowerCase() !== creator.toLowerCase()) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  delete pastes[id];
  await writePastes(pastes);

  return NextResponse.json({ success: true });
}
