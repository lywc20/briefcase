"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import { Actor, Message } from "./types";
import { fetchFirstContact, fetchResponseStream } from "./apis";
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
  const abortRef = useRef<AbortController | null>(null);
  const [input, setInput] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleAbort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsLoading(false);
    }
  }, [setIsLoading]);

  const submitMessage = useCallback(
    async (message: string) => {
      setMessages((prev) => [
        ...prev,
        newMessage(message, getNextId(), Actor.YOU),
      ]);
      setIsLoading(true);

      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const botMessageId = getNextId();
        setMessages((prev) => [
          ...prev,
          newMessage("", botMessageId, Actor.SYSTEM),
        ]);

        let accumulatedContent = "";

        const stream = fetchResponseStream(message, controller.signal);
        for await (const chunk of stream) {
          accumulatedContent += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: accumulatedContent }
                : msg,
            ),
          );
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          console.warn("Request aborted");
          return;
        }
        if (err instanceof Error) {
          setMessages((prev) => [
            ...prev,
            newMessage("Error, " + err.message, getNextId(), Actor.SYSTEM),
          ]);

          console.warn(err);
        }
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
          abortRef.current = null;
        }
      }
    },
    [setMessages, setIsLoading, getNextId],
  );

  const handleSubmit = useCallback(async () => {
    const value = input.trim();
    if (!value) return;

    setInput("");
    await submitMessage(value);
  }, [input, submitMessage]);

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

      <button
        type={isLoading ? "button" : "submit"}
        onClick={isLoading ? handleAbort : undefined}
        className={`h-10 w-24 px-4 rounded-md text-white font-medium transition-colors cursor-pointer ${isLoading
            ? "bg-red-500 hover:bg-red-600 active:bg-red-700"
            : "bg-sky-500 hover:bg-sky-600 active:bg-sky-700"
          }`}
      >
        {isLoading ? "Abort" : "Send"}
      </button>
    </form>
  );
};
export default ChatComponent;
