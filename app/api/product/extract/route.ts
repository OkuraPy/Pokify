import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the URL from the request body
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Make the request to the Linkfy API
    const response = await fetch('https://api.linkfy.io/api/text/extract-web-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-token': 'FV1CTFNIs7skgnrdZz9JdbVloNTP3WuA'
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from Linkfy API:', errorText);
      return NextResponse.json(
        { error: `Failed to extract product data: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error extracting product data:', error);
    return NextResponse.json(
      { error: 'Failed to extract product data' },
      { status: 500 }
    );
  }
}
