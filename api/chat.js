export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { prompt, userKey, model = 'arcee-ai/trinity-large-preview:free', lang = 'ru' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!userKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    const systemPrompt = lang === 'ru' 
      ? 'Ты робот Пиксель. Отвечай кратко (1-2 фразы). Если просят включить/выключить свет, используй команды LED_ON или LED_OFF. Формат ответа строго: Text: [фраза для озвучки] Commands: [команда или null]'
      : 'You are Pixel robot. Answer briefly (1-2 phrases). If asked to turn on/off light, use commands LED_ON or LED_OFF. Response format strictly: Text: [speech phrase] Commands: [command or null]';
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://pixel-ai.vercel.app',
        'X-Title': 'Pixel AI'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `OpenRouter API error: ${response.status}`
      });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message });
  }
}