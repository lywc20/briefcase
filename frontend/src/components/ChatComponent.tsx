"use client";
import { useRef, useEffect, useCallback, useState } from "react";
const ChatComponent = () => {
  const [messages, setMessages] = useState(["You have entered the chat room."]);
  console.log(messages);
  return (
    <>
      <ChatLog messages={messages} />
      <ChatInputBuffer setMessages={setMessages} />
    </>
  );
};

const ChatLog = ({ messages = [] }: { messages: string[] }) => {
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
      <div className="border-2 border-solid border-black bg-white text-black h-[500px] w-[250px] m-[10px] flex flex-col overflow-auto p-[3px] justify-end">
        {messages.map((message, id) => (
          <div key={id} className="p-1">
            {message}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </>
  );
};

type ChatInputBufferProps = {
  setMessages: React.Dispatch<React.SetStateAction<string[]>>;
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
      setMessages((prev) => [...prev, message]);

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
          width: "250px",
        }}
      />

      <input
        type="submit"
        value="Enter"
        style={{
          border: "1px solid black",
          height: "50px",
          width: "50px",
        }}
      />
    </form>
  );
};
export default ChatComponent;
