export const formatTime = (date: Date) => {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}; 