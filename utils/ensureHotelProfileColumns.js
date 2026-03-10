const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Add optional HotelProfile columns if they don't exist (description, hours, social links).
 * Safe to run multiple times (ADD COLUMN IF NOT EXISTS).
 */
async function ensureHotelProfileColumns() {
  try {
    const columns = [
      { name: 'description', sql: 'ADD COLUMN IF NOT EXISTS "description" TEXT' },
      { name: 'openingTime', sql: 'ADD COLUMN IF NOT EXISTS "openingTime" VARCHAR(255)' },
      { name: 'closingTime', sql: 'ADD COLUMN IF NOT EXISTS "closingTime" VARCHAR(255)' },
      { name: 'specialHolidayHours', sql: 'ADD COLUMN IF NOT EXISTS "specialHolidayHours" VARCHAR(255)' },
      { name: 'facebookUrl', sql: 'ADD COLUMN IF NOT EXISTS "facebookUrl" VARCHAR(255)' },
      { name: 'instagramUrl', sql: 'ADD COLUMN IF NOT EXISTS "instagramUrl" VARCHAR(255)' },
      { name: 'twitterUrl', sql: 'ADD COLUMN IF NOT EXISTS "twitterUrl" VARCHAR(255)' },
      { name: 'linkedinUrl', sql: 'ADD COLUMN IF NOT EXISTS "linkedinUrl" VARCHAR(255)' },
    ];

    for (const col of columns) {
      try {
        await sequelize.query(
          `ALTER TABLE "hotel_profiles" ${col.sql}`
        );
      } catch (e) {
        if (e.message && e.message.includes('does not exist')) {
          console.warn('[Migration] hotel_profiles table may not exist yet:', e.message);
          break;
        }
        console.warn(`[Migration] ensureHotelProfileColumns ${col.name}:`, e.message);
      }
    }
  } catch (error) {
    console.warn('[Migration] ensureHotelProfileColumns failed:', error.message);
  }
}

module.exports = { ensureHotelProfileColumns };
