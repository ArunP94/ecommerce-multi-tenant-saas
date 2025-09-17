import { NextRequest, NextResponse } from "next/server";

// Support method override from form POSTs with _method=DELETE for HTML forms
export async function POST(req: NextRequest, context: { params: Promise<{ storeId: string }> }) {
  const contentType = req.headers.get('content-type') || '';
  let methodOverride = '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    const data = new URLSearchParams(text);
    methodOverride = (data.get('_method') || '').toUpperCase();
  }

  if (methodOverride === 'DELETE') {
    const url = new URL(req.url);
    const origin = url.origin;
    const { storeId } = await context.params;
    const res = await fetch(`${origin}/api/super-admin/stores/${storeId}`, { method: 'DELETE' });
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  }

  return NextResponse.json({ error: 'Unsupported' }, { status: 400 });
}
