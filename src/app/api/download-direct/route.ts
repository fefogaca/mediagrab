import { NextRequest, NextResponse } from 'next/server';
import YTDlpWrap from 'yt-dlp-wrap';
import { Readable } from 'stream';

const ytDlpWrap = new YTDlpWrap();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const format = searchParams.get('format') || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

  if (!url) {
    return NextResponse.json({ message: 'URL is required' }, { status: 400 });
  }

  try {
    const readableStream = ytDlpWrap.execStream([url, '-f', format, '-o', '-']);

    const responseStream = new ReadableStream({
      start(controller) {
        readableStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        readableStream.on('end', () => {
          controller.close();
        });
        readableStream.on('error', (err) => {
          console.error('Stream error:', err);
          controller.error(err);
        });
      },
    });

    // Suggest a filename to the browser.
    // We need to get video info to get a real title, for now, let's use a generic name.
    // This can be improved later by passing the title as a query param.
    const filename = `media-download.mp4`;

    return new NextResponse(responseStream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Download failed:', error);
    return NextResponse.json({ message: 'Download failed', error: (error as Error).message }, { status: 500 });
  }
}