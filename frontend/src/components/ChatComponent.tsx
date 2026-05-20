"use client";
import { useRef, useEffect, useCallback, useState } from "react";

const YOU = "you";
type Message = {
  author?: string;
  content: string;
};

function newMessage(content: string, author?: string) {
  return { author, content };
}
const firstMessage = {
  content: "You have entered the chat room.",
};

const ChatComponent = () => {
  const [messages, setMessages] = useState([firstMessage]);
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
      <ChatInputBuffer setMessages={setMessages} />
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
      <div className="border-2 border-solid border-black bg-white text-black h-[500px] w-[350px] m-[10px] flex flex-col overflow-auto p-[3px] justify-end">
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
};

const ChatInputBuffer = ({ setMessages }: ChatInputBufferProps) => {
  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;

      const messageBuffer = form.elements.namedItem(
        "message",
      ) as HTMLInputElement;

      const message = messageBuffer.value;
      if (!message) return;
      setMessages((prev) => [...prev, newMessage(message, YOU)]);

      messageBuffer.value = "";
    },
    [setMessages],
  );

  return (
    <form onSubmit={onSubmit}>
      <input
        name="message"
        type="text"
        style={{
          border: "2px solid black",
          margin: "10px",
          color: "black",
          background: "white",
          height: "100px",
          width: "350px",
        }}
      />

      <input
        type="submit"
        value="Send"
        style={{
          border: "1px solid black",
          height: "50px",
          background: "gray",
          width: "100px",
        }}
      />
    </form>
  );
};
export default ChatComponent;
