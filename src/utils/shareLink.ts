const CODE_PARAMETER = 'code';
const COMPRESSION_FORMAT: CompressionFormat = 'deflate-raw';
const MAX_DECODED_BYTES = 1_048_576;

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

const fromBase64Url = (text: string) =>
  Uint8Array.from(
    atob(text.replaceAll('-', '+').replaceAll('_', '/')),
    (character) => character.charCodeAt(0)
  );

const limitBytes = (limit: number) => {
  let total = 0;

  return new TransformStream<Uint8Array, Uint8Array>({
    transform: (chunk, controller) => {
      total += chunk.byteLength;

      if (total > limit)
        throw new RangeError(`Decoded code exceeds ${limit} bytes`);

      controller.enqueue(chunk);
    },
  });
};

const encodeCode = async (code: string): Promise<string> => {
  const compressed = new Blob([code])
    .stream()
    .pipeThrough(new CompressionStream(COMPRESSION_FORMAT));
  const bytes = new Uint8Array(await new Response(compressed).arrayBuffer());

  return toBase64Url(bytes);
};

const decodeCode = async (encoded: string): Promise<string> => {
  const decompressed = new Blob([fromBase64Url(encoded)])
    .stream()
    .pipeThrough(new DecompressionStream(COMPRESSION_FORMAT))
    .pipeThrough(limitBytes(MAX_DECODED_BYTES));

  return new Response(decompressed).text();
};

export const createShareLink = async (code: string): Promise<string> => {
  const url = new URL(location.pathname, location.origin);

  url.hash = new URLSearchParams({
    [CODE_PARAMETER]: await encodeCode(code),
  }).toString();

  return url.href;
};

export const consumeSharedCode = async (): Promise<string | null> => {
  const encoded = new URLSearchParams(location.hash.slice(1)).get(
    CODE_PARAMETER
  );
  if (encoded === null) return null;

  const code = await decodeCode(encoded).catch(() => null);
  if (code === null) return null;

  history.replaceState(null, '', location.pathname + location.search);

  return code;
};
