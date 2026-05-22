"use client";
import { useRef, useEffect, useCallback, useState } from "react";

const YOU = "you";
type Message = {
  author?: string;
  content: string;
};

const newMessage = (content: string, author?: string) => ({ author, content });

const ChatComponent = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const firstContact = async () => {
      try {
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/first_contact`,
        );
        const data = (await resp.json()) as Message;
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        if (err instanceof Error) {
          console.warn(err.message);
          setMessages((prev) => [...prev, newMessage(err.message)]);
        } else {
          console.warn(err);
        }
      }
    };

    firstContact();
  }, []);

  return (
    <>
      <ChatLog messages={messages} />
      <ChatInputBuffer
        setIsLoading={setIsLoading}
        isLoading={isLoading}
        setMessages={setMessages}
      />
    </>
  );
};

const ColorCoder = ({ author }: { author?: string }) => {
  const mapper: Record<string, string> = {
    you: "text-blue-500",
    system: "text-red-500",
  };

  if (!author) {
    return <span></span>;
  }

  return (
    <>
      <span className={`${mapper[author]} font-bold`}>{author}</span>
      <span>:</span>
    </>
  );
};
const ChatLog = ({ messages = [] }: { messages: Message[] }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = bottomRef.current;

    if (!el) return;

    const container = el.parentElement as HTMLDivElement | null;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    if (isNearBottom) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  return (
    <>
      <hr />
      <div className="border-2 border-black bg-white text-black h-[500px] w-[350px] m-[10px] flex flex-col overflow-auto p-[3px]">
        {messages.map((message, id) => (
          <div key={id} className="p-1">
            <ColorCoder author={message.author} /> {message.content}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </>
  );
};

type ChatInputBufferProps = {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChatInputBuffer = ({
  setMessages,
  isLoading,
  setIsLoading,
}: ChatInputBufferProps) => {
  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;

      const messageBuffer = form.elements.namedItem(
        "message",
      ) as HTMLInputElement;

      const message = messageBuffer.value;
      if (!message) return;
      setMessages((prev) => [...prev, newMessage(message, YOU)]);
      setIsLoading(true);

      messageBuffer.value = "";
      try {
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/query`,
          {
            method: "POST",
            body: JSON.stringify({ content: message, author: YOU }),
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        const payload = await resp.json();

        setMessages((prev) => [
          ...prev,
          newMessage(payload.content, payload.author),
        ]);
      } catch (err) {
        console.warn(err);
      } finally {
        setIsLoading(false);
      }
    },
    [setMessages, setIsLoading],
  );

  return (
    <form onSubmit={onSubmit} className="gap-5 flex item-end ml-2">
      <textarea
        name="message"
        className="h-24 w-[350px] resize-none rounded-md border-2 border-black bg-white p-2 text-black focus:outline-none"
        autoComplete="off"
        autoFocus={true}
      />

      <input
        type="submit"
        disabled={isLoading}
        value={isLoading ? "Loading" : "Send"}
        className={`h-10 w-24 px-4 rounded-md text-white transition-colors ${
          isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-sky-500"
        }`}
      />
    </form>
  );
};
export default ChatComponent;
