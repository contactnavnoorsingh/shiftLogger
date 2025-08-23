import { NextResponse } from 'next/server';
import axios from 'axios';

const localPolish = (text: string) => {
  if (!text) return '';
  let t = text.trim().replace(/\s+/g, ' ');
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += '.';
  if (t.length > 220) t = t.slice(0, 217).replace(/\s+\S*$/, '') + '…';
  return t;
};

export async function POST(request: Request) {
    try {
        const { note } = await request.json();
        if (!note) {
            return NextResponse.json({ error: 'Note is required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ text: localPolish(note) });
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                { role: 'system', content: "You are an assistant that rewrites short, raw notes into concise, professional security shift-log sentences (1–2 sentences). Keep factual, neutral tone, include what happened and any action taken. Avoid repeating exact phrasing for routine patrol entries. Output only the rewritten sentence. Max 220 characters." },
                { role: 'user', content: note }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        
        const polishedText = response.data?.choices?.[0]?.message?.content?.trim() || localPolish(note);
        return NextResponse.json({ text: polishedText });
    } catch (error) {
        const { note } = await request.json().catch(() => ({note: ''}));
        return NextResponse.json({ text: localPolish(note) }, { status: 500 });
    }
}