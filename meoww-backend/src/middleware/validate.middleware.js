import { ZodError } from "zod";

export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (result.body) req.body = result.body;
      if (result.params) req.params = result.params;
      if (result.query) req.query = result.query;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues[0]?.message ?? "Invalid request data";
        return res.status(400).json({ error: message });
      }

      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  };
}