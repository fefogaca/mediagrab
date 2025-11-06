import { NextRequest, NextResponse } from 'next/server';
import YTDlpWrap from 'yt-dlp-wrap';
import ytdl from 'ytdl-core';

import { validateMediaUrl } from '@/lib/media/providers';

const ytDlpWrap = new YTDlpWrap();
const DEFAULT_FORMAT = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

type StreamSource = 'yt-dlp' | 'ytdl-core';

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const urlParam = searchParams.get('url');
  const formatParam = searchParams.get('format') || DEFAULT_FORMAT;
  const source = (searchParams.get('source') as StreamSource | null) ?? 'yt-dlp';

  if (!urlParam) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'MISSING_URL',
          message: 'Inclua a URL do vídeo para iniciar o download.',
        },
      },
      { status: 400 },
    );
  }

  const validation = validateMediaUrl(urlParam);
  if (!validation.ok) {
    const status = validation.reason === 'INVALID_URL' ? 400 : 415;
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: validation.reason,
          message: validation.message,
        },
      },
      { status },
    );
  }

  const url = validation.normalizedUrl;
  const provider = validation.provider;
  const format = formatParam;

  try {
    if (source === 'ytdl-core' && provider.id === 'youtube') {
      const nodeStream = ytdl(url, { quality: format });
      const responseStream = toReadableStream(nodeStream);

      return buildStreamResponse(responseStream);
    }

    const nodeStream = ytDlpWrap.execStream([url, '-f', format, '-o', '-']);
    const responseStream = toReadableStream(nodeStream);
    return buildStreamResponse(responseStream);
  } catch (primaryError) {
    console.error('Falha no stream primário:', primaryError);

    if (provider.id === 'youtube' && source !== 'ytdl-core') {
      try {
        const fallbackStream = ytdl(url, { quality: format });
        const responseStream = toReadableStream(fallbackStream);
        return buildStreamResponse(responseStream);
      } catch (fallbackError) {
        console.error('Falha no fallback ytdl-core:', fallbackError);
      }
    }

    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'STREAM_FAILURE',
          message: 'Não foi possível iniciar o download agora. Tente novamente mais tarde.',
        },
      },
      { status: 502 },
    );
  }
}

function toReadableStream(stream: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on('end', () => {
        controller.close();
      });
      stream.on('error', (error) => {
        controller.error(error);
      });
    },
    cancel() {
      if ('destroy' in stream && typeof stream.destroy === 'function') {
        stream.destroy();
      }
    },
  });
}

function buildStreamResponse(stream: ReadableStream<Uint8Array>) {
  const filename = 'media-download.mp4';
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}