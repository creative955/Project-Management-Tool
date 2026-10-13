import type { NextConfig } from "next";

/**
 * Extra origins allowed to call Server Actions (comma-separated hosts, wildcards
 * allowed), e.g. when the app sits behind a preview proxy whose public host differs
 * from the forwarded host.
 */
const extraOrigins = (process.env.SERVER_ACTION_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const previewOrigins = ["*.agent.cvm.dev", "*.cursorvm.com"];

const nextConfig: NextConfig = {
  allowedDevOrigins: previewOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: [...previewOrigins, ...extraOrigins],
    },
  },
};

export default nextConfig;
