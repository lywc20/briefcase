"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import { Actor, Message } from "./types";
import { fetchFirstContact, fetchResponse } from "./apis";
import { useCmdKFocus, useChatAutoScroll, useSequentialId } from "./utils";

const newMessage = (
  content: string,
  id: number,
  author: Actor | undefined = undefined,
) => ({ author, content, id });

const ChatComponent = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const getNextId = useSequentialId();
  useEffect(() => {
    const firstContact = async () => {
      try {
        const resp = await fetchFirstContact();
        const data = (await resp.json()) as Message;
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        if (err instanceof Error) {
          console.warn(err.message);
          setMessages((prev) => [
            ...prev,
            newMessage(err.message, getNextId()),
          ]);
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
        getNextId={getNextId}
      />
    </>
  );
};

const ColorCoder = ({ author }: { author?: Actor }) => {
  const mapper: Record<Actor, string> = {
    you: "text-blue-500",
    system: "text-red-500",
  };

  if (!author) {
    return null;
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

  useChatAutoScroll(bottomRef, [messages]);
  return (
    <>
      <hr />
      <div className="border-2 border-black bg-white text-black h-[500px] w-[350px] m-[10px] flex flex-col overflow-auto p-[3px]">
        {messages.map((message) => (
          <div key={message.id} className="p-1">
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
  getNextId: () => number;
};

const ChatInputBuffer = ({
  setMessages,
  isLoading,
  setIsLoading,
  getNextId,
}: ChatInputBufferProps) => {
  const submitMessage = useCallback(
    async (message: string) => {
      setMessages((prev) => [
        ...prev,
        newMessage(message, getNextId(), Actor.YOU),
      ]);
      setIsLoading(true);

      try {
        const resp = await fetchResponse(message);
        const payload = await resp.json();

        setMessages((prev) => [
          ...prev,
          newMessage(payload.content, getNextId(), payload.author),
        ]);
      } catch (err) {
        if (err instanceof Error) {
          setMessages((prev) => [
            ...prev,
            newMessage("Error, " + err.message, getNextId(), Actor.SYSTEM),
          ]);

          console.warn(err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [setMessages, setIsLoading, getNextId],
  );

  const [input, setInput] = useState("");
  const handleSubmit = useCallback(async () => {
    const value = input.trim();
    if (!value) return;

    setInput("");
    await submitMessage(value);
  }, [input, submitMessage]);

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  useCmdKFocus(textAreaRef);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="gap-5 flex items-end ml-2"
    >
      <textarea
        ref={textAreaRef}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key == "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
        name="message"
        className="h-24 w-[350px] resize-none rounded-md border-2 border-black bg-white p-2 text-black focus:outline-none"
        autoComplete="off"
        autoFocus={true}
        value={input}
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
