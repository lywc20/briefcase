import Link from "next/link";
import styles from "./NavButton.module.css";

type NavButtonProps = {
  href: string;
  children: React.ReactNode;
};

export default function NavButton({ href, children }: NavButtonProps) {
  return (
    <Link href={href} className={styles.button}>
      {children}
    </Link>
  );
}
