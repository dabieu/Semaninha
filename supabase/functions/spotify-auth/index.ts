const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TokenRequest {
  code: string;
  redirect_uri: string;
}

interface RefreshRequest {
  refresh_token: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const CLIENT_ID = Deno.env.get('VITE_SPOTIFY_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('VITE_SPOTIFY_CLIENT_SECRET');

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Spotify credentials not configured');
    }

    if (action === 'token' && req.method === 'POST') {
      const { code, redirect_uri }: TokenRequest = await req.json();

      const tokenData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      });

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Spotify token error:', errorData);
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    if (action === 'refresh' && req.method === 'POST') {
      const { refresh_token }: RefreshRequest = await req.json();

      const refreshData = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      });

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: refreshData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Spotify refresh error:', errorData);
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Spotify auth error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});