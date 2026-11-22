"use client";

import { Text as DreiText, type TextProps } from "@react-three/drei";

/**
 * ASCII glyph sanitiser for in-world text.
 *
 * Only two latin subsets are self-hosted (Rajdhani and IBM Plex Mono). Characters
 * outside those subsets make troika resolve a fallback font over the network at
 * runtime, which is slow, third-party and fails offline. Mapping the handful of
 * typographic characters we actually use keeps every label self-contained.
 */
const GLYPHS: Record<string, string> = {
  "\u2014": "-", // em dash
  "\u2013": "-", // en dash
  "\u2012": "-",
  "\u2212": "-",
  "\u2192": ">", // right arrow
  "\u2190": "<",
  "\u2191": "^",
  "\u2193": "v",
  "\u00b7": "*", // middle dot
  "\u2022": "*",
  "\u00d7": "x",
  "\u2248": "~",
  "\u2264": "<=",
  "\u2265": ">=",
  "\u2026": "...",
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u00a0": " ",
};

export function sanitizeGlyphs(value: string) {
  let out = "";
  for (const char of value) {
    const mapped = GLYPHS[char];
    if (mapped !== undefined) {
      out += mapped;
    } else if (char.charCodeAt(0) > 0x2ff) {
      // Anything else outside Latin Extended cannot be rendered by the subsets.
      out += "?";
    } else {
      out += char;
    }
  }
  return out;
}

function sanitizeChildren(children: TextProps["children"]): TextProps["children"] {
  if (typeof children === "string") return sanitizeGlyphs(children);
  if (typeof children === "number") return children;
  if (Array.isArray(children)) return children.map((child) => sanitizeChildren(child));
  return children;
}

/**
 * Drop-in replacement for drei's <Text> that guarantees self-hosted glyphs.
 */
export function Text({ children, ...props }: TextProps) {
  return <DreiText {...props}>{sanitizeChildren(children)}</DreiText>;
}
