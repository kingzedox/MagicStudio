import { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MIN_ELEMENT_SIZE = 10;

function sanitizeElements(elements: any[]) {
  if (!Array.isArray(elements)) return [];
  return elements.map(el => {
    if (!el || typeof el !== 'object') return null;
    const type = ['rect', 'circle', 'star', 'triangle', 'text'].includes(el.type) ? el.type : 'rect';
    const x = typeof el.x === 'number' ? Math.max(-50, Math.min(CANVAS_WIDTH, el.x)) : 100;
    const y = typeof el.y === 'number' ? Math.max(-50, Math.min(CANVAS_HEIGHT, el.y)) : 100;
    const w = typeof el.w === 'number' ? Math.max(MIN_ELEMENT_SIZE, Math.min(CANVAS_WIDTH, el.w)) : 120;
    let h = typeof el.h === 'number' ? Math.max(MIN_ELEMENT_SIZE, Math.min(CANVAS_HEIGHT, el.h)) : 120;
    const color = (typeof el.color === 'string' && (el.color.startsWith('#') || el.color.startsWith('rgb') || ['black','white','red','blue','green','yellow','purple','orange','gray'].includes(el.color.toLowerCase()))) ? el.color : '#6366f1';
    const rotation = typeof el.rotation === 'number' ? el.rotation % 360 : 0;
    const cornerRadius = typeof el.cornerRadius === 'number' ? el.cornerRadius : (type === 'rect' ? 8 : undefined);
    const stroke = typeof el.stroke === 'string' ? el.stroke : undefined;
    const strokeWidth = typeof el.strokeWidth === 'number' ? el.strokeWidth : undefined;
    const groupId = typeof el.groupId === 'string' ? el.groupId : undefined;

    if (type === 'text') {
      let fontSize = typeof el.fontSize === 'number' ? Math.max(12, Math.min(72, el.fontSize)) : 24;
      h = Math.min(h, fontSize * 2.5);
      let text = typeof el.text === 'string' ? el.text.trim() : 'Text';
      if (text.length > 100) text = text.substring(0, 100);
      return {
        id: el.id, type, x, y, w, h, rotation, color, stroke, strokeWidth, groupId,
        text, fontSize, fontFamily: el.fontFamily || 'Arial', fontStyle: el.fontStyle || 'bold', align: el.align || 'center'
      };
    }
    return { id: el.id, type, x, y, w, h, rotation, color, stroke, strokeWidth, groupId, cornerRadius };
  }).filter(el => el !== null);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, currentElements, groqApiKey } = req.body || {};
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
       return res.status(400).json({ error: "Valid prompt is required" });
    }

    const activeGroqKey = groqApiKey || process.env.GROQ_API_KEY;

    if (!activeGroqKey) {
      return res.status(400).json({ 
        error: "GROQ_API_KEY is not set. Please set GROQ_API_KEY in environment variables." 
      });
    }

    const groq = new Groq({ apiKey: activeGroqKey });

    const sanitizedElements = Array.isArray(currentElements) 
      ? currentElements.map(el => {
          if (el.type === 'image') return { ...el, imageUrl: '[IMAGE_DATA_REMOVED]' };
          return el;
        })
      : [];

    const hasExisting = sanitizedElements.length > 0;
    const currentCanvasContext = hasExisting 
      ? `CURRENT CANVAS ELEMENTS:\n${JSON.stringify(sanitizedElements, null, 2)}`
      : "CURRENT CANVAS IS EMPTY.";

    const systemPrompt = `You are an expert AI vector layout designer for a ${CANVAS_WIDTH}x${CANVAS_HEIGHT} canvas.
The user provides a design prompt, and optionally the current elements on the canvas.

CANVAS SPECIFICATIONS:
- Canvas dimensions: Width = ${CANVAS_WIDTH}px, Height = ${CANVAS_HEIGHT}px.
- Center of canvas: X = ${CANVAS_WIDTH / 2}, Y = ${CANVAS_HEIGHT / 2}.
- Shape types available: 'rect', 'circle', 'star', 'triangle', 'text'.

CONTEXT & MODIFICATION RULES:
1. IF CURRENT CANVAS ELEMENTS EXIST:
   - If the user says "add X", PRESERVE ALL existing elements and APPEND the new element(s).
   - If the user says "change X to Y" or "make background dark", UPDATE the existing elements.
   - DO NOT discard existing elements unless explicitly asked.

2. NESTING / TEXT INSIDE SHAPES:
   - Create the shape first.
   - Then, create a 'text' element placed DIRECTLY IN THE CENTER of that shape.
   - Place the text at position: x = shape.x, y = shape.y + (shape.h / 2) - (fontSize / 2).
   - Set text 'w' = shape.w, 'align' = 'center'.

3. STRICT RULES FOR SHAPES:
   - 'x' and 'y' inside ${CANVAS_WIDTH}x${CANVAS_HEIGHT}.
   - 'w' and 'h' between 30 and ${CANVAS_HEIGHT}.
   - 'color': Hex color string.
   - 'cornerRadius': For 'rect' shapes, optionally set 0 to 30.

4. STRICT RULES FOR 'text' SHAPES:
   - 'text': Short, clean string.
   - 'fontSize': 14 to 40.
   - 'align': 'center', 'left', or 'right'.
   - 'color': High contrast hex color code.

Return ONLY a valid JSON object: { "elements": [ ... ] }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${currentCanvasContext}\n\nUSER PROMPT: "${prompt}"` }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = chatCompletion.choices[0]?.message?.content || "{}";
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      return res.status(500).json({ error: "AI returned invalid JSON format" });
    }
    
    const rawElements = parsed.elements || [];
    const cleanElements = sanitizeElements(rawElements);
    return res.json({ elements: cleanElements });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to generate AI elements";
    return res.status(500).json({ error: errorMessage });
  }
}
