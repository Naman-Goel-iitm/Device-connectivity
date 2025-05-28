import { Device } from '../types';

/**
 * Returns information about the current device
 */
export const getDeviceInfo = (): Omit<Device, 'isHost'> => {
  const id = `device_${Date.now()}`;
  
  // Detect if the device is mobile or desktop
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Get device name (simplified version)
  let name = isMobile ? 'Mobile Device' : 'Desktop';
  
  // Try to get more specific platform info
  if (navigator.platform) {
    if (/Win/.test(navigator.platform)) name = 'Windows Device';
    else if (/Mac/.test(navigator.platform)) name = 'Mac Device';
    else if (/Linux/.test(navigator.platform)) name = 'Linux Device';
    else if (/iPhone|iPad|iPod/.test(navigator.platform)) name = 'iOS Device';
    else if (/Android/.test(navigator.userAgent)) name = 'Android Device';
  }
  
  return {
    id,
    name,
    type: isMobile ? 'mobile' : 'desktop'
  };
};

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};