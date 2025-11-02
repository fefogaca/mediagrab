
import { NextRequest, NextResponse } from 'next/server';
import YTDlpWrap from 'yt-dlp-wrap';

const ytDlpWrap = new YTDlpWrap();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required.' }, { status: 400 });
  }

  try {
    const videoInfo = await ytDlpWrap.getVideoInfo(url);
    const { title, formats } = videoInfo;

    const processedFormats = formats
      .filter(f => (f.vcodec !== 'none' && f.acodec !== 'none') || (f.vcodec !== 'none' && !f.acodec) || (f.acodec !== 'none' && !f.vcodec))
      .map(f => {
        const directDownloadUrl = new URL('/api/download-direct', request.nextUrl.origin);
        directDownloadUrl.searchParams.set('url', url);
        directDownloadUrl.searchParams.set('format', f.format_id);

        return {
          format_id: f.format_id,
          ext: f.ext,
          resolution: f.resolution || (f.acodec !== 'none' ? 'Audio Only' : 'Video Only'),
          quality: f.quality,
          vcodec: f.vcodec,
          acodec: f.acodec,
          filesize_approx: f.filesize_approx,
          download_url: directDownloadUrl.toString(),
        };
      });

    const response = {
      title,
      requested_url: url,
      formats: processedFormats,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Failed to get video info:', error.message);
    if (error.message.includes('Unsupported URL') || error.message.includes('not found') || error.message.includes('404')) {
      return NextResponse.json({ error: 'The requested video URL could not be found or is not supported.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to process the video URL.', details: error.message }, { status: 500 });
  }
}
