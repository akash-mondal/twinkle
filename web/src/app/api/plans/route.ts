import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// File-based storage - configurable via environment variable for VPS deployment
const DATA_DIR = process.env.PASTE_DATA_DIR || join(process.cwd(), '.paste-data');
const DATA_FILE = join(DATA_DIR, 'plans.json');

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  intervalDays: number;
  trialDays: number;
  creator: string;
  createdAt: string;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify({ plans: [] }));
  }
}

function readPlans(): Plan[] {
  ensureDataDir();
  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data).plans || [];
  } catch {
    return [];
  }
}

function writePlans(plans: Plan[]) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify({ plans }, null, 2));
}

// GET - Get plan(s)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const creator = searchParams.get('creator');

  const plans = readPlans();

  if (id) {
    const plan = plans.find((p) => p.id === id);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    return NextResponse.json(plan);
  }

  if (creator) {
    const creatorPlans = plans.filter((p) => p.creator.toLowerCase() === creator.toLowerCase());
    return NextResponse.json(creatorPlans);
  }

  // Return all plans (for browsing)
  return NextResponse.json(plans);
}

// POST - Create plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, price, intervalDays, trialDays, creator } = body;

    if (!id || !name || !price || !intervalDays || !creator) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const plans = readPlans();

    if (plans.find((p) => p.id === id)) {
      return NextResponse.json({ error: 'Plan already exists' }, { status: 409 });
    }

    const newPlan: Plan = {
      id,
      name,
      description: description || '',
      price,
      intervalDays,
      trialDays: trialDays || 0,
      creator,
      createdAt: new Date().toISOString(),
    };

    plans.push(newPlan);
    writePlans(plans);

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

// PUT - Update plan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, creator, ...updates } = body;

    if (!id || !creator) {
      return NextResponse.json({ error: 'Missing id or creator' }, { status: 400 });
    }

    const plans = readPlans();
    const idx = plans.findIndex((p) => p.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plans[idx].creator.toLowerCase() !== creator.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    plans[idx] = { ...plans[idx], ...updates };
    writePlans(plans);

    return NextResponse.json(plans[idx]);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE - Delete plan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const creator = searchParams.get('creator');

    if (!id || !creator) {
      return NextResponse.json({ error: 'Missing id or creator' }, { status: 400 });
    }

    const plans = readPlans();
    const plan = plans.find((p) => p.id === id);

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.creator.toLowerCase() !== creator.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const filteredPlans = plans.filter((p) => p.id !== id);
    writePlans(filteredPlans);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
