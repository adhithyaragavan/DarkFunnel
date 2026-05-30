export async function serpSearch(query: string) {
  const apiKey = process.env.BRIGHTDATA_API_KEY;
  const zone = process.env.BRIGHTDATA_SERP_ZONE;

  if (!apiKey || !zone) {
    console.log("Missing Bright Data API key or Zone. Falling back to mock SERP search for:", query);
    return [];
  }

  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&brd_json=1`;

  try {
    const payload: { zone: string; url: string; format: string } = {
      zone: zone,
      url: targetUrl,
      format: 'raw' // brd_json=1 in the URL tells the proxy to return parsed JSON.
    };

    const response = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`Bright Data SERP API error: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.organic || [];
  } catch (error) {
    console.error("Error calling Bright Data SERP API:", error);
    return [];
  }
}

export async function scrapeUrl(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain'
      }
    });

    if (!response.ok) {
      console.error(`Jina Reader error for URL ${url}: ${response.statusText}`);
      return "";
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Error calling Jina Reader API:", error);
    return "";
  }
}
