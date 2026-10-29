import { Link, Route, Router, Routes } from "lakebed/client";
import { Admin } from "./admin";
import { Checkout } from "./checkout";
import { Shop } from "./shop";
import { Brand, DISPLAY_FONT, SANS_FONT, useFonts } from "./ui";

function NotFound() {
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-[var(--paper)] px-5 text-center text-[var(--ink)]" style={SANS_FONT}>
      <Brand />
      <h1 class="mt-8 text-[clamp(2.6rem,6vw,4rem)] font-semibold leading-none" style={DISPLAY_FONT}>
        No encontramos esta página.
      </h1>
      <p class="mt-3 text-[14px] text-[var(--muted)]">La pieza que buscas no está aquí.</p>
      <Link class="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-[13.5px] font-medium text-[var(--button-ink)]" to="/">
        Volver a la tienda
      </Link>
    </div>
  );
}

export function App() {
  useFonts();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
