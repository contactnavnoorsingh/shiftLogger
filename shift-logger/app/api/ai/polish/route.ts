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
                    // FIX: Updated instructions based on security industry standards.
                    content: "You are an assistant that rewrites raw security notes into a professional, third-person shift log entry based on industry standards. Your response must be a single, concise sentence (max 220 characters). The log must be factual, objective, and written in the third person (no 'I' or 'we'). \n\n**Core Principles:**\n1.  **Actor:** If the note mentions visiting a guard, use the format S/G \"Name\". If no guard is mentioned, the actor is the Mobile Supervisor (M/S).\n2.  **Action & Location:** Clearly state the action and the full location. For an alarm, the format must be 'responded to an alarm from [Company] at [Location]'. Do not omit the location.\n3.  **Details:** Accurately summarize the findings (e.g., 'noted a break-in', 'all areas secure', 'parking ticket issued').\n4.  **Guard Checks:** For guard visits, clearly state the status of each checked item.\n\n**Example Transformation:**\n-   *Input:* `alarm at 123 Main St for Bell, found break-in`\n-   *Output:* `M/S responded to an alarm from Bell at 123 Main St and noted a break-in.`\n\nOutput only the rewritten log entry." 
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
