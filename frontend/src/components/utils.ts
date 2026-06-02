import { useEffect, useRef, useCallback } from "react";

export function useCmdKFocus(
  inputRef: React.RefObject<HTMLTextAreaElement | null>,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isCmdK) return;

      const active = document.activeElement;

      const isTyping =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable);

      if (isTyping) return;

      e.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

export function useChatAutoScroll(
  scrollAnchorRef: React.RefObject<HTMLDivElement | null>,
  dependencies: React.DependencyList,
) {
  useEffect(() => {
    const scrollAnchor = scrollAnchorRef.current;

    if (!scrollAnchor) return;

    const container = scrollAnchor.parentElement;
    if (!(container instanceof HTMLDivElement)) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    if (isNearBottom) {
      scrollAnchor.scrollIntoView({ behavior: "smooth" });
    }
  }, dependencies);
}

export function useSequentialId() {
  const idRef = useRef(0);

  const nextId = useCallback(() => {
    idRef.current += 1;
    return idRef.current;
  }, []);

  return nextId;
}
