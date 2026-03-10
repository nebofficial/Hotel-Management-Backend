/**
 * Simple in-memory documentation data and helpers
 * for the User Guide module.
 */

const guides = {
  overview: {
    title: "System Overview",
    sections: [
      {
        id: "architecture",
        title: "System architecture overview",
        summary:
          "High-level view of how the PMS, POS, reporting, and integrations work together.",
      },
      {
        id: "navigation",
        title: "Navigation guide",
        summary:
          "Explains the main menu groups, quick access shortcuts, and where to find common actions.",
      },
    ],
  },
  modules: [
    {
      id: "front-desk",
      name: "Front Desk & Reservations",
      description:
        "Covers reservations, check-in / check-out, room assignment, and availability calendar.",
    },
    {
      id: "housekeeping",
      name: "Housekeeping",
      description:
        "Explains cleaning schedules, inspections, laundry, and linen tracking.",
    },
    {
      id: "pos",
      name: "Restaurant / POS Management",
      description:
        "Details restaurant orders, tables, KOT, POS billing, and menu configuration.",
    },
    {
      id: "reports",
      name: "Reports & Analytics",
      description:
        "Describes occupancy, revenue, tax, and performance reports available in the system.",
    },
  ],
};

const tutorials = [
  {
    id: "create-reservation",
    title: "How to create a reservation",
    module: "Front Desk",
    steps: [
      "Open the Reservations & Front Office menu.",
      "Click 'New Reservation'.",
      "Select dates, room type, and guest details.",
      "Review pricing and confirm the booking.",
    ],
    videoUrl: "https://example.com/videos/create-reservation",
  },
  {
    id: "checkin-guest",
    title: "How to check-in a guest",
    module: "Front Desk",
    steps: [
      "Open today's arrivals from the dashboard.",
      "Verify guest identity and reservation details.",
      "Assign room and capture payment method.",
      "Confirm check-in and print registration card if needed.",
    ],
    videoUrl: "https://example.com/videos/checkin-guest",
  },
  {
    id: "generate-invoice",
    title: "How to generate an invoice",
    module: "Billing",
    steps: [
      "Open the Billing or Guest Ledger module.",
      "Locate the guest stay or restaurant bill.",
      "Review charges and taxes.",
      "Generate and download or print the invoice.",
    ],
    videoUrl: "https://example.com/videos/generate-invoice",
  },
];

const faqs = [
  {
    id: "login-issues",
    question: "I cannot log in to my account. What should I do?",
    answer:
      "Verify your email and password, ensure caps lock is off, and contact your administrator if the issue persists.",
    category: "Authentication",
  },
  {
    id: "change-language",
    question: "How do I change the system language?",
    answer:
      "Go to Settings → Currency & Language, select your preferred language, and save the settings.",
    category: "General",
  },
  {
    id: "backup-location",
    question: "Where are system backups stored?",
    answer:
      "Backups are stored on the configured server or cloud location. Contact your system administrator for details.",
    category: "Backup",
  },
];

const documents = [
  {
    id: "hotel-manager-user-manual",
    title: "Hotel Manager – User Manual",
    description: "Complete user manual for front office, housekeeping, and billing.",
    url: "#",
    size: "4.2 MB",
    format: "PDF",
  },
  {
    id: "training-guide",
    title: "Front Desk Training Guide",
    description: "Step-by-step guide to train new front desk staff.",
    url: "#",
    size: "2.1 MB",
    format: "PDF",
  },
];

function getGuides() {
  return {
    overview: guides.overview,
    modules: guides.modules,
  };
}

function getTutorials() {
  return tutorials;
}

function getFaqs() {
  return faqs;
}

function getDocuments() {
  return documents;
}

function searchTopics(queryRaw) {
  const query = (queryRaw || "").toLowerCase();
  if (!query) {
    return [];
  }

  const matches = [];

  guides.modules.forEach((m) => {
    if (
      m.name.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query)
    ) {
      matches.push({
        type: "module",
        title: m.name,
        snippet: m.description,
      });
    }
  });

  tutorials.forEach((t) => {
    if (
      t.title.toLowerCase().includes(query) ||
      t.steps.some((s) => s.toLowerCase().includes(query))
    ) {
      matches.push({
        type: "tutorial",
        title: t.title,
        snippet: t.steps[0],
      });
    }
  });

  faqs.forEach((f) => {
    if (
      f.question.toLowerCase().includes(query) ||
      f.answer.toLowerCase().includes(query)
    ) {
      matches.push({
        type: "faq",
        title: f.question,
        snippet: f.answer,
      });
    }
  });

  return matches.slice(0, 30);
}

function getDocumentById(id) {
  return documents.find((d) => d.id === id) || null;
}

module.exports = {
  getGuides,
  getTutorials,
  getFaqs,
  getDocuments,
  searchTopics,
  getDocumentById,
};

