import { Route, Routes } from "react-router-dom";
import { ChatPage } from "../features/chat/ChatPage";

function NotFoundPage() {
  return (
    <main>
      <h1>Pagina no encontrada</h1>
      <a href="/">Volver al inicio</a>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
