import NavButton from "./NavButton";

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "8px",
        padding: "10px",
        // background: "#d7e7ff",
        background: "grey",
        borderBottom: "2px solid silver",
      }}
    >
      <NavButton href="/">Home</NavButton>
      <NavButton href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>
        Mail
      </NavButton>
      <NavButton href="/chat">Chat</NavButton>
      <NavButton href="/news">Github</NavButton>
    </nav>
  );
}
