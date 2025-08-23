import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
    try {
        const { date, timings, designation, body } = await request.json();

        // CRITICAL FIX: If there are no entries, return a standard message without calling AI.
        if (!body || body.trim() === '') {
            return NextResponse.json({ text: "No entries were logged during this shift. All was quiet." });
        }

        const logContent = `Date: ${date}\nShift: ${timings}\nDesignation: ${designation}\n\nLog Entries:\n${body}`;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ text: "Shift completed. AI summary not available." });
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                { role: 'system', content: "Summarize the provided security shift log into 2–4 concise, professional sentences. Include key incidents and resolutions. If no key incidents are mentioned, state that the shift was routine and uneventful. Do not invent, guess, or infer events that are not explicitly mentioned in the log entries. Output the summary only." },
                { role: 'user', content: logContent }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });

        const summary = response.data?.choices?.[0]?.message?.content?.trim() || "Could not generate AI summary.";
        return NextResponse.json({ text: summary });
    } catch (error) {
        return NextResponse.json({ text: "Error generating summary." }, { status: 500 });
    }
}