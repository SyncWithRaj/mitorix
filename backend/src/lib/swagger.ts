/**
 * Swagger/OpenAPI configuration and spec generation.
 *
 * Generates an OpenAPI 3.0 specification from JSDoc annotations across
 * all route files. The interactive Swagger UI is served at /api/docs.
 */
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RepoLens API",
      version: "1.0.0",
      description:
        "REST API for RepoLens — an AI-powered code intelligence platform that allows developers to query, analyze, and understand repositories using natural language.",
      contact: {
        name: "RepoLens",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "Current environment",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
