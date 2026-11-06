import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import express, {
  type ErrorRequestHandler,
  type Express,
} from "express";
import helmet from "helmet";

const frontendDistPath = fileURLToPath(new URL("../../dist/", import.meta.url));

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/api", (_request, response) => {
    response.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "La ruta solicitada no existe.",
      },
    });
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(frontendDistPath));
    app.get("/{*path}", (_request, response, next) => {
      response.sendFile(resolve(frontendDistPath, "index.html"), (error) => {
        if (error) {
          next(error);
        }
      });
    });
  }

  app.use((_request, response) => {
    response.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "La ruta solicitada no existe.",
      },
    });
  });

  const errorHandler: ErrorRequestHandler = (_error, _request, response, next) => {
    if (response.headersSent) {
      next(_error);
      return;
    }

    console.error("Error interno al procesar una solicitud de la API.");
    response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Ocurrio un error interno.",
      },
    });
  };

  app.use(errorHandler);

  return app;
}
