import { Actor } from "./types";

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
