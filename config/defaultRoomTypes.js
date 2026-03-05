/**
 * Default room types with descriptions for guest capacity and room features.
 * Seeded per hotel when none exist.
 */
const DEFAULT_ROOM_TYPES = [
  { name: 'Single', description: 'For 1–2 guests', defaultCapacity: 2, sortOrder: 1 },
  { name: 'Double', description: 'For 2 guests', defaultCapacity: 2, sortOrder: 2 },
  { name: 'Triple', description: 'For 3 guests', defaultCapacity: 3, sortOrder: 3 },
  { name: 'Quad', description: 'For 4 guests', defaultCapacity: 4, sortOrder: 4 },
  { name: 'Queen', description: '1 queen-sized bed (60 × 80 inches / 152 × 203 cm)', defaultCapacity: 2, sortOrder: 5 },
  { name: 'King', description: '1 king-sized bed (76 × 80 inches / 193 × 203 cm)', defaultCapacity: 2, sortOrder: 6 },
  { name: 'Twin', description: 'Two separate beds', defaultCapacity: 2, sortOrder: 7 },
  { name: 'Hollywood Twin', description: 'Two beds joined by a single headboard', defaultCapacity: 2, sortOrder: 8 },
  { name: 'Double-Double', description: 'Two double or queen beds', defaultCapacity: 4, sortOrder: 9 },
  { name: 'Standard', description: 'Basic features; functional and economical', defaultCapacity: 2, sortOrder: 10 },
  { name: 'Superior', description: 'Extra comfort or slightly larger space', defaultCapacity: 2, sortOrder: 11 },
  { name: 'Deluxe', description: 'Enhanced amenities, higher comfort, better view', defaultCapacity: 2, sortOrder: 12 },
  { name: 'Suite', description: 'Separate living area with premium comfort and services', defaultCapacity: 4, sortOrder: 13 },
  { name: 'Studio', description: 'Single-room layout with compact living space', defaultCapacity: 2, sortOrder: 14 },
  { name: 'Apartment-Style', description: 'Separate living and kitchen area with self-catering options', defaultCapacity: 4, sortOrder: 15 },
];

module.exports = { DEFAULT_ROOM_TYPES };
