export enum Actor {
  YOU = "you",
  SYSTEM = "system",
}

export type Message = {
  author?: Actor;
  content: string;
  id: number;
};
