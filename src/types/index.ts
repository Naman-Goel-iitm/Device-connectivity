export interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile';
  isHost: boolean;
  socketId: string;
}

export interface Room {
  id: string;
  code: string;
  devices: Device[];
  host: string; // device id of host
  createdAt: Date;
}

export interface FileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface TextTransfer {
  id: string;
  content: string;
  type: 'text' | 'link';
  senderId: string;
  receiverId: string;
  createdAt: Date;
}

export type TransferItem = FileTransfer | TextTransfer;

export interface ConnectionState {
  room: Room | null;
  connected: boolean;
  devices: Device[];
  isHost: boolean;
}