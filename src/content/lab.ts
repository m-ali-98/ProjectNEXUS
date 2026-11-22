/** Application Lab — development stations and the illustrative chat reconstruction. */

export type LabStation = {
  id: string;
  label: string;
  code: string;
  tagline: string;
  detail: string;
  practices: string[];
  technologies: string[];
  confidence: "professional" | "working" | "familiar";
  relatedProject: string;
};

export const labStations: LabStation[] = [
  {
    id: "lab-rn",
    label: "React Native",
    code: "APP-01",
    tagline: "One application, two platforms",
    detail:
      "Cross-platform application development with native capability access. The value is not 'write once' — it is a shared component and state architecture with platform-specific edges handled deliberately.",
    practices: [
      "Screen composition with platform-aware layout",
      "Native capability access through modules",
      "Shared component library across the app",
      "Debugging against a real device, not only a simulator",
    ],
    technologies: ["React Native", "JavaScript", "TypeScript", "StyleSheet"],
    confidence: "working",
    relatedProject: "mission-002",
  },
  {
    id: "lab-ts",
    label: "JavaScript & TypeScript",
    code: "APP-02",
    tagline: "Types as a design tool",
    detail:
      "TypeScript is most valuable at the boundaries: API payloads, navigation parameters, state shapes. Those are the places where a wrong assumption costs the most debugging time.",
    practices: [
      "Typed API contracts instead of ad-hoc objects",
      "Discriminated unions for state machines and async results",
      "Strictness used to catch refactor damage early",
      "Async flows written with explicit failure paths",
    ],
    technologies: ["TypeScript", "JavaScript", "Async/await", "Modules"],
    confidence: "professional",
    relatedProject: "mission-001",
  },
  {
    id: "lab-nav",
    label: "React Navigation",
    code: "APP-03",
    tagline: "The screen graph is an architecture",
    detail:
      "Navigation defines what the application is allowed to do. Stack, tab and nested navigators map a product's information hierarchy; parameters define what one screen must know about another.",
    practices: [
      "Nested navigators with clear ownership",
      "Typed route parameters",
      "Deep-link entry points treated as real entry points",
      "Back behaviour verified, not assumed",
    ],
    technologies: ["React Navigation", "Stack", "Tabs", "Deep linking"],
    confidence: "working",
    relatedProject: "mission-002",
  },
  {
    id: "lab-state",
    label: "Redux & state",
    code: "APP-04",
    tagline: "One source of truth, many views",
    detail:
      "Shared state becomes a problem when several screens each hold a copy. Centralised, normalised state with derived selectors keeps a conversation list and a conversation thread consistent by construction.",
    practices: [
      "Normalised entities by id",
      "Selectors for derived presentation",
      "Explicit action lifecycle: request, success, failure",
      "Optimistic updates reconciled against server truth",
    ],
    technologies: ["Redux", "Selectors", "Actions", "Async flows"],
    confidence: "professional",
    relatedProject: "mission-002",
  },
  {
    id: "lab-ui",
    label: "UI/UX & animation",
    code: "APP-05",
    tagline: "Motion carries meaning",
    detail:
      "Interface animation is communication: it shows where a screen came from, that an action was accepted, or that something is pending. Decorative motion is removed; meaningful motion is deliberate.",
    practices: [
      "Transitions that preserve spatial context",
      "Immediate feedback for every interaction",
      "Accessible contrast, targets and text scaling",
      "Reduced-motion paths for sensitive users",
    ],
    technologies: ["React Native Animated", "CSS transitions", "Design systems"],
    confidence: "professional",
    relatedProject: "mission-002",
  },
  {
    id: "lab-api",
    label: "API integration",
    code: "APP-06",
    tagline: "Assume the network will fail",
    detail:
      "A client is only as good as its handling of slow, partial and failed responses. Loading, retry, empty and error states are part of the feature, not polish applied afterwards.",
    practices: [
      "Centralised request layer with typed responses",
      "Retry with backoff where it is safe",
      "Error surfaces that tell the user what to do next",
      "Payload validation at the boundary",
    ],
    technologies: ["REST", "HTTP", "TypeScript types", "Error handling"],
    confidence: "professional",
    relatedProject: "mission-001",
  },
  {
    id: "lab-device",
    label: "Camera, video & voice",
    code: "APP-07",
    tagline: "Device capabilities are a lifecycle",
    detail:
      "Capture means permissions, temporary files, previews, cancellation and cleanup. Wrapping that lifecycle in one module keeps screens unaware of platform detail and prevents leaked artefacts.",
    practices: [
      "Permission request flows with denial handling",
      "Temporary file cleanup after upload or cancel",
      "Preview state kept out of persistent storage",
      "Device testing across real hardware",
    ],
    technologies: ["Camera", "Video", "Voice", "Permissions"],
    confidence: "working",
    relatedProject: "mission-002",
  },
  {
    id: "lab-chat",
    label: "Chat systems",
    code: "APP-08",
    tagline: "Conversation is a state machine",
    detail:
      "Sending is optimistic, delivery is asynchronous, ordering matters, and media disrupts both. A chat interface is where state management, device capability and network failure all meet.",
    practices: [
      "Message lifecycle: pending, sent, delivered, failed",
      "Unread and last-message state derived, not duplicated",
      "Media attachments with their own progress state",
      "Scroll position preserved on new messages",
    ],
    technologies: ["React Native", "Redux", "REST", "Media"],
    confidence: "working",
    relatedProject: "mission-002",
  },
];

/**
 * Illustrative reconstruction of a messaging interface.
 * This is authored content for NEXUS — NOT a screenshot of the original app,
 * and it contains no real users, messages or client data.
 */
export const chatMockup = {
  disclaimer:
    "Illustrative interface reconstruction authored for NEXUS. Not a screenshot of the original application; no real conversation data is shown.",
  device: { label: "FIELD TERMINAL", model: "RN-CHAT / MOCK" },
  screens: [
    { id: "thread", label: "Conversation" },
    { id: "list", label: "Threads" },
    { id: "media", label: "Capture" },
    { id: "state", label: "State" },
  ],
  contact: {
    name: "OPS CHANNEL",
    status: "illustrative",
    presence: "simulated presence",
  },
  messages: [
    {
      id: "m1",
      from: "remote" as const,
      sender: "OPS",
      text: "Upload received. Verifying checksum before processing.",
      time: "09:41",
      state: "delivered" as const,
    },
    {
      id: "m2",
      from: "local" as const,
      sender: "YOU",
      text: "Camera capture attached — 2 files, queued for upload.",
      time: "09:42",
      state: "sent" as const,
    },
    {
      id: "m3",
      from: "remote" as const,
      sender: "OPS",
      text: "Acknowledged. Reconnect buffer is holding the second file.",
      time: "09:42",
      state: "delivered" as const,
    },
    {
      id: "m4",
      from: "local" as const,
      sender: "YOU",
      text: "Voice note queued.",
      time: "09:43",
      state: "pending" as const,
    },
  ],
  stateFlow: [
    { id: "compose", label: "Compose", detail: "Local draft held in screen state, not global store." },
    { id: "send", label: "Dispatch", detail: "Redux action marks the message pending and renders immediately." },
    { id: "media", label: "Media", detail: "Attachment uploads with progress; cancel releases temporary files." },
    { id: "ack", label: "Reconcile", detail: "Server response replaces the optimistic entry; failures become retryable." },
  ],
};
