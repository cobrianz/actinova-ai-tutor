import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  // Attempt dynamic import of mammoth; provide clear error if not installed
  let mammoth;
  try {
    mammoth = await import('mammoth');
  } catch (e) {
    return NextResponse.json({ error: 'mammoth not installed. Run `npm install mammoth`.' }, { status: 500 });
  }

  try {
    const templatePath = path.resolve(process.cwd(), 'templates', 'actinova-academic.dotx');
    const buffer = await fs.promises.readFile(templatePath);
    const result = await mammoth.convertToHtml({ buffer });
    return NextResponse.json({ html: result.value });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
