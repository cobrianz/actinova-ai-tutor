import { NextResponse } from "next/server";

export function getCronSecret() {
  const secret = process.env.CRON_SECRET?.trim();
  return secret || null;
}

export function authorizeCronRequest(request) {
  const configuredSecret = getCronSecret();

  if (!configuredSecret) {
    return NextResponse.json(
      { error: "Cron secret is not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const customSecret = request.headers.get("x-cron-secret");
  const providedSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : customSecret;

  if (providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
