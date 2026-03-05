/**
 * Generate a random password with pattern: hotelname@randomdigitandchar
 * @param {string} hotelName - Name of the hotel
 * @returns {string} - Generated password
 */
const generatePassword = (hotelName) => {
  // Clean hotel name: remove spaces, convert to lowercase, remove special characters
  const cleanHotelName = hotelName
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^a-z0-9]/g, '') // Remove special characters, keep only letters and numbers
    .substring(0, 10); // Limit to 10 characters to keep password reasonable length

  // Generate random alphanumeric string (mix of digits and characters)
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomLength = 6; // 6 random characters
  let randomPart = '';
  
  for (let i = 0; i < randomLength; i++) {
    randomPart += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }

  // Combine: hotelname@randompart
  const password = `${cleanHotelName}@${randomPart}`;
  
  return password;
};

module.exports = {
  generatePassword,
};
