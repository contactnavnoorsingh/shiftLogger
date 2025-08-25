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
                { 
                    role: 'system', 
                    content: "You are an assistant that rewrites raw security notes into a professional, third-person shift log entry. Your response must be a single, concise sentence (max 220 characters). **Do not use personal pronouns like 'I' or 'we'.** When mentioning a guard, always use the format S/G followed by the guard's name in quotes (e.g., S/G \"Lavish\"). Report actions and observations factually. For guard checks, clearly state the status of each item. For example, instead of 'memos were secure', state 'dashboard memos were checked and up to date' or 'dashboard memos were not updated'. Output only the rewritten log entry." 
                },
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
