export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; message: string };

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      status: 400,
      message: "El tipo de contenido debe ser application/json.",
    };
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      status: 413,
      message: "El cuerpo de la solicitud excede el limite permitido.",
    };
  }

  if (!request.body) {
    return { ok: false, status: 400, message: "El cuerpo de la solicitud es obligatorio." };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return {
        ok: false,
        status: 413,
        message: "El cuerpo de la solicitud excede el limite permitido.",
      };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(body)) as unknown };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, status: 400, message: "El cuerpo de la solicitud debe ser JSON valido." };
    }
    throw error;
  }
}
