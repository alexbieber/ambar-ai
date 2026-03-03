# CORS Solution for Anthropic API

The Anthropic API has CORS restrictions when called directly from the browser. Here are solutions:

## Option 1: Use a CORS Proxy (Quick Fix)

You can use a CORS proxy service. Update the API calls in `src/App.tsx` to use:

```typescript
const proxyUrl = 'https://cors-anywhere.herokuapp.com/'
const apiUrl = 'https://api.anthropic.com/v1/messages'
const codeResponse = await fetch(proxyUrl + apiUrl, { ... })
```

**Note:** Free CORS proxies may have rate limits.

## Option 2: Create a Backend Proxy (Recommended)

Create a simple Node.js/Express backend to proxy requests:

1. Create `server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  const { apiKey, prompt } = req.body;
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Proxy server running on port 3001'));
```

2. Update `src/App.tsx` to call `http://localhost:3001/api/generate` instead.

## Option 3: Browser Extension (For Development)

Use a CORS browser extension like "CORS Unblock" for development only.

## Current Status

The app is configured to call the API directly. If you get CORS errors, use one of the solutions above.
