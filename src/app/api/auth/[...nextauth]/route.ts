import { handlers } from "@backend/lib/auth";

// Export handlers de forma segura para o build
export const GET = handlers?.GET || (() => {
  throw new Error('NextAuth GET handler not available');
});

export const POST = handlers?.POST || (() => {
  throw new Error('NextAuth POST handler not available');
});

