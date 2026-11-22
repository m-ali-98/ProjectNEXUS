import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Contact endpoint.
 *
 * Real validation, honeypot detection and in-memory rate limiting run always.
 * Delivery requires RESEND_API_KEY / CONTACT_TO_EMAIL; when they are absent the
 * endpoint responds honestly with `not_configured` instead of pretending a
 * message was delivered.
 */

const ContactSchema = z.object({
  name: z.string().trim().min(2, "at least 2 characters").max(80, "maximum 80 characters"),
  email: z.string().trim().email("a valid email address is required").max(160),
  message: z
    .string()
    .trim()
    .min(20, "please write at least 20 characters")
    .max(4000, "maximum 4000 characters"),
  company: z.string().max(200).optional().default(""),
});

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 4;

function rateLimited(key: string) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS;
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim();
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request", message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(payload);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fields[key] = issue.message;
    }
    return NextResponse.json(
      { ok: false, code: "validation_failed", message: "Some fields need attention.", fields },
      { status: 422 },
    );
  }

  const { name, email, message, company } = parsed.data;

  // Honeypot: a real user never sees this field.
  if (company.trim().length > 0) {
    return NextResponse.json({ ok: true, message: "Message received." });
  }

  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many messages from this address. Please try again later.",
      },
      { status: 429 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? "NEXUS Contact <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_configured",
        message:
          "Message transport is not configured on this deployment. The form validated your message, but no mail was sent. Set RESEND_API_KEY and CONTACT_TO_EMAIL to enable delivery — until then use the listed contact channels.",
      },
      { status: 503 },
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `NEXUS contact — ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const detail = await response.text();
      console.error("[NEXUS contact] provider rejected the message", response.status, detail);
      return NextResponse.json(
        {
          ok: false,
          code: "delivery_failed",
          message: "The mail provider rejected the message. Please try again or use the listed channels.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Message transmitted. I will reply to the address you provided.",
    });
  } catch (error) {
    console.error("[NEXUS contact] transport error", error);
    return NextResponse.json(
      {
        ok: false,
        code: "delivery_failed",
        message: "The mail transport could not be reached. Please try again shortly.",
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  const configured = Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL);
  return NextResponse.json({
    ok: true,
    configured,
    message: configured
      ? "Contact endpoint is configured."
      : "Contact endpoint is online but mail transport is not configured.",
  });
}
