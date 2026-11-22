"use client";

import { useState } from "react";
import { profile } from "@/content/profile";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent"; message: string }
  | { state: "unconfigured"; message: string }
  | { state: "error"; message: string; fields?: Record<string, string> };

export function ContactForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [values, setValues] = useState({ name: "", email: "", message: "", company: "" });

  const update = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          message: values.message,
          company: values.company,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        code?: string;
        message?: string;
        fields?: Record<string, string>;
      };

      if (data.ok) {
        setStatus({ state: "sent", message: data.message ?? "Message received." });
        setValues({ name: "", email: "", message: "", company: "" });
        return;
      }
      if (data.code === "not_configured") {
        setStatus({
          state: "unconfigured",
          message:
            data.message ??
            "Message transport is not configured on this deployment yet. The form is functional but cannot deliver mail until RESEND_API_KEY and CONTACT_TO_EMAIL are set.",
        });
        return;
      }
      setStatus({
        state: "error",
        message: data.message ?? "The message was rejected by validation.",
        fields: data.fields,
      });
    } catch {
      setStatus({
        state: "error",
        message: "Network error — the contact endpoint could not be reached.",
      });
    }
  }

  const channels = profile.contact.channels;

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        {channels.map((channel) => (
          <div key={channel.id} className="border border-line bg-black/30 p-3">
            <div className="nx-label">{channel.label}</div>
            {channel.href ? (
              <a
                href={channel.href}
                target={channel.id === "email" ? undefined : "_blank"}
                rel="noreferrer"
                className="mt-1 block break-all font-mono text-[12px] text-accent hover:text-white"
              >
                {channel.value}
              </a>
            ) : (
              <div className="mt-1 font-mono text-[12px] text-ink-dim">{channel.value}</div>
            )}
            {!channel.verified && (
              <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-amber/80">
                awaiting configuration
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className={compact ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
          <label className="block">
            <span className="nx-label">Name</span>
            <input
              className="nx-input mt-1"
              name="name"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              value={values.name}
              onChange={update("name")}
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="nx-label">Email</span>
            <input
              className="nx-input mt-1"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={values.email}
              onChange={update("email")}
              placeholder="you@example.com"
            />
          </label>
        </div>

        <label className="block">
          <span className="nx-label">Message</span>
          <textarea
            className="nx-input mt-1 min-h-[120px] resize-y"
            name="message"
            required
            minLength={20}
            maxLength={4000}
            value={values.message}
            onChange={update("message")}
            placeholder="Project, role or question — a few sentences is enough."
          />
          <span className="mt-1 block text-right font-mono text-[9px] text-ink-faint">
            {values.message.length}/4000
          </span>
        </label>

        {/* Honeypot: hidden from users, filled by bots. */}
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label>
            Company
            <input
              tabIndex={-1}
              autoComplete="off"
              name="company"
              value={values.company}
              onChange={update("company")}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="nx-btn nx-btn-primary"
            disabled={status.state === "sending"}
          >
            {status.state === "sending" ? "Transmitting…" : "Transmit message"}
          </button>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">
            validated server-side · rate limited
          </span>
        </div>

        <div aria-live="polite" className="min-h-[1px]">
          {status.state === "sent" && (
            <p className="border-l-2 border-good/60 bg-[#08170f] px-3 py-2 font-mono text-[11px] text-[#7ff0b8]">
              {status.message}
            </p>
          )}
          {status.state === "unconfigured" && (
            <p className="border-l-2 border-amber/60 bg-[#171208] px-3 py-2 font-mono text-[11px] leading-relaxed text-[#f2c68a]">
              {status.message}
            </p>
          )}
          {status.state === "error" && (
            <p className="border-l-2 border-alert/60 bg-[#170b0a] px-3 py-2 font-mono text-[11px] leading-relaxed text-[#ff9b93]">
              {status.message}
              {status.fields && (
                <span className="mt-1 block text-[10px] text-[#c9928d]">
                  {Object.entries(status.fields)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(" · ")}
                </span>
              )}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
