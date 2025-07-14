import { Device } from '../types';

/**
 * Returns information about the current device
 */
export const getDeviceInfo = (): Omit<Device, 'isHost'> => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/i.test(userAgent);
  
  return {
    id: `device_${Date.now()}`,
    name: isMobile ? 'Mobile Device' : 'Desktop Device',
    type: isMobile ? 'mobile' : 'desktop',
    socketId: '' // This will be set by the server
  };
};

/**
 * Returns true if the current device is a mobile device
 */
export const isMobileDevice = (): boolean => {
  return /iphone|ipad|ipod|android|blackberry|windows phone/i.test(navigator.userAgent.toLowerCase());
};

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};