/**
 * Optional discoveries. They never contain essential professional information —
 * they are environmental storytelling and small technical notes.
 */

export type Discovery = {
  id: string;
  code: string;
  label: string;
  sector: string;
  title: string;
  body: string[];
  hint: string;
  /** Unlock is triggered by this interaction id in the world. */
  interactionId: string;
};

export const discoveries: Discovery[] = [
  {
    id: "dev-corner",
    code: "SEC-01",
    label: "Hidden developer workstation",
    sector: "personal-quarters",
    title: "The other machine",
    body: [
      "A second workstation, deliberately unlabelled: three monitors, one of them vertical for reading logs, and a mechanical keyboard that has clearly been used far more than the showroom desk beside it.",
      "Personal note: the vertical monitor is not a design choice. Stack traces are longer than they are wide.",
    ],
    hint: "Personal Quarters — look behind the display wall.",
    interactionId: "quarters-dev-corner",
  },
  {
    id: "hardware-corner",
    code: "SEC-02",
    label: "Hardware experimentation bench",
    sector: "personal-quarters",
    title: "Bench notes — stability before speed",
    body: [
      "A bench with a partially disassembled system, a spare cooler and a notebook of timing experiments. Nothing here is presented as professional qualification — it is where performance intuition is built.",
      "The recurring note in the margin: change one variable, run it long enough to mean something, write it down.",
    ],
    hint: "Personal Quarters — the low bench opposite the timeline wall.",
    interactionId: "quarters-hardware-bench",
  },
  {
    id: "atrium-maintenance",
    code: "SEC-03",
    label: "Maintenance crawl access",
    sector: "atrium",
    title: "Facility maintenance log",
    body: [
      "A maintenance panel tucked behind an atrium column. The last entry reads: 'Coolant loop nominal. Reminder — the certificate on the east relay expires in 12 days. Renew before it becomes an outage, not after.'",
      "The most reliable infrastructure habit is the most boring one: verify the renewal actually happened.",
    ],
    hint: "Central Atrium — behind the column on the outer ring.",
    interactionId: "atrium-maintenance-panel",
  },
  {
    id: "archive-draft",
    code: "SEC-04",
    label: "Unpublished mission note",
    sector: "project-archive",
    title: "Mission log — discarded approach",
    body: [
      "A pinned note beside the archive terminal: 'Attempt 1 — poll the provider status endpoint every 10 seconds. Rejected: it hides the truth behind a delay and doubles the load.'",
      "Recorded here because the discarded approaches are usually the interesting part of the engineering.",
    ],
    hint: "Project Archive — the drafting table at the rear of the hall.",
    interactionId: "archive-draft-note",
  },
  {
    id: "net-console",
    code: "SEC-05",
    label: "Obsolete resolver console",
    sector: "network-operations",
    title: "Resolver notes — TTL discipline",
    body: [
      "An old resolver console kept powered on as a reference. Its sticky note: 'The TTL you set before the migration is the outage you avoid after it.'",
      "Decrease the TTL a day early, move the record, verify from several resolvers, then restore it.",
    ],
    hint: "Network Operations — the console beneath the globe.",
    interactionId: "net-legacy-console",
  },
];

export const getDiscovery = (id: string) => discoveries.find((d) => d.id === id);
export const discoveryByInteraction = (interactionId: string) =>
  discoveries.find((d) => d.interactionId === interactionId);
