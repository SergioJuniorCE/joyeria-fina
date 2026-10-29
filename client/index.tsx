import { Link, Route, Router, Routes } from "lakebed/client";
import { Admin } from "./admin";
import { Shop } from "./shop";
import { Brand, DISPLAY_FONT, SANS_FONT, useFonts } from "./ui";

function NotFound() {
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-[#f2f1ec] px-5 text-center text-[#14171c]" style={SANS_FONT}>
      <Brand />
      <h1 class="mt-8 text-[clamp(2.6rem,6vw,4rem)] font-semibold leading-none" style={DISPLAY_FONT}>
        No encontramos esta página.
      </h1>
      <p class="mt-3 text-[14px] text-[#565b64]">La pieza que buscas no está aquí.</p>
      <Link class="mt-6 inline-flex items-center justify-center rounded-full bg-[#203a6b] px-6 py-3 text-[13.5px] font-medium text-[#f7f6f1]" to="/">
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
