import { Actor } from "./types";

/**
 * Fetch request for LLM response
 *
 * @deprecated switching to fetchResponseStream for Streaming pattern
 */
export async function fetchResponse(
  message: string,
  abortSignal?: AbortSignal,
) {
  return await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/query`, {
    method: "POST",
    body: JSON.stringify({ content: message, author: Actor.YOU }),
    headers: {
      "Content-Type": "application/json",
    },
    signal: abortSignal,
  });
}

export async function fetchFirstContact() {
  return await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/first_contact`);
}

export async function* fetchResponseStream(
  message: string,
  abortSignal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/query`, {
    method: "POST",
    body: JSON.stringify({ content: message, author: Actor.YOU }),
    headers: {
      "Content-Type": "application/json",
    },
    signal: abortSignal,
  });

  if (!resp.body) {
    throw new Error("ReadableStream not supported or empty body received.");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        yield decoder.decode(value, { stream: true });
      }
    }
  } finally {
    reader.releaseLock();
  }
}
