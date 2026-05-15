import NavButton from "./NavButton";

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "8px",
        padding: "10px",
        background: "grey",
        borderBottom: "2px solid silver",
      }}
    >
      <NavButton href="/">Home</NavButton>
      <NavButton href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>
        Mail
      </NavButton>
      <NavButton href={process.env.NEXT_PUBLIC_CONTACT_LINKEDIN as string}>
        LinkedIn
      </NavButton>
      <NavButton href={process.env.NEXT_PUBLIC_GITHUB as string}>
        Github
      </NavButton>
    </nav>
  );
}
