/**
 * Generates a random 6-character alphanumeric room code
 */
export const generateRoomCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Validates a room code format
 */
export const validateRoomCode = (code: string): boolean => {
  const pattern = /^[A-Z0-9]{6}$/;
  return pattern.test(code);
};

/**
 * Formats a room code with spaces for better readability
 * e.g., "ABC123" -> "ABC 123"
 */
export const formatRoomCode = (code: string): string => {
  if (!code) return '';
  return code.replace(/(.{3})(.{3})/, '$1 $2');
};