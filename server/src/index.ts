import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un numero entero entre 1 y 65535.");
}

createApp().listen(port, () => {
  console.log(`API disponible en http://localhost:${port}`);
});
