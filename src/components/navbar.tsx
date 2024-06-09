import Link from "next/link";
import { ModeToggle } from "./mode-toggle";

export function Navbar() {
  return (
    <div className="flex justify-between items-center">
      <Link href="/">
        <h1>NextTickets</h1>
      </Link>

      <nav>
        <ul className="flex gap-x-2 items-center">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/about">About</Link>
          </li>
          <li>
            <Link href="/auth/sign-in">Login</Link>
          </li>
          <li>
            <ModeToggle />
          </li>
        </ul>
      </nav>
    </div>
  );
}
