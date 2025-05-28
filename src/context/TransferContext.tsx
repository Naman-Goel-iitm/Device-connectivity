import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileTransfer, TextTransfer, TransferItem } from '../types';
import { useConnection } from './ConnectionContext';

interface TransferContextType {
  transfers: TransferItem[];
  clearTransfers: () => void;
  sendText: (content: string, receiverId: string, type: 'text' | 'link') => Promise<string>;
  sendFile: (file: File, receiverId: string) => Promise<string>;
  downloadFile: (transferId: string) => void;
}

const TransferContext = createContext<TransferContextType | undefined>(undefined);

export const TransferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [pendingTransfers] = useState(new Map<string, FileTransfer>());
  const [fileDataMap] = useState(new Map<string, { data: ArrayBuffer; fileName: string; fileType: string }>());
  const { connectionState, socket } = useConnection();

  useEffect(() => {
    if (!socket) return;

    socket.on('transfer:received', (transfer: TransferItem) => {
      console.log('Received transfer:', transfer);
      
      if ('progress' in transfer) {
        // Store file transfer in pending transfers
        pendingTransfers.set(transfer.id, transfer as FileTransfer);
      }

      setTransfers(prev => {
        if (prev.some(t => t.id === transfer.id)) {
          console.log('Transfer already exists, skipping:', transfer.id);
          return prev;
        }
        console.log('Adding new transfer:', transfer);
        return [...prev, transfer];
      });
    });

    socket.on('transfer:file', ({ transferId, fileData, fileName, fileType }) => {
      console.log('Received file data:', { transferId, fileName, fileType }); // Debug log
      
      // Get transfer from pending transfers
      const transfer = pendingTransfers.get(transferId);
      if (!transfer) {
        console.error('Transfer not found in pending transfers:', transferId); // Debug log
        return;
      }

      try {
        // Store file data for later download
        fileDataMap.set(transferId, { data: fileData, fileName, fileType });

        // Update transfer status
        setTransfers(prev =>
          prev.map(t =>
            t.id === transferId && 'progress' in t
              ? { ...t, progress: 100, status: 'completed' }
              : t
          )
        );

        // Remove from pending transfers
        pendingTransfers.delete(transferId);
      } catch (error) {
        console.error('Error handling file data:', error); // Debug log
      }
    });

    socket.on('transfer:progress', ({ id, progress }: { id: string; progress: number }) => {
      console.log('Transfer progress:', { id, progress }); // Debug log
      setTransfers(prev =>
        prev.map(t =>
          t.id === id && 'progress' in t
            ? { ...t, progress, status: progress === 100 ? 'completed' : 'transferring' }
            : t
        )
      );
    });

    socket.on('room:left', () => {
      console.log('Room left, clearing transfers'); // Debug log
      setTransfers([]);
      pendingTransfers.clear();
      fileDataMap.clear();
    });

    socket.on('transfer:chunk', ({ transferId, chunk, offset, total, chunkNumber, totalChunks }) => {
      console.log('Received file chunk:', { 
        transferId, 
        offset, 
        total, 
        chunkNumber,
        totalChunks,
        chunkSize: chunk instanceof ArrayBuffer ? chunk.byteLength : chunk.length 
      });
      
      // Get transfer from pending transfers
      const transfer = pendingTransfers.get(transferId);
      if (!transfer) {
        console.error('Transfer not found in pending transfers:', transferId);
        return;
      }

      try {
        // Store chunk in file data map
        if (!fileDataMap.has(transferId)) {
          fileDataMap.set(transferId, {
            data: new Uint8Array(total),
            fileName: transfer.fileName,
            fileType: transfer.fileType
          });
        }

        const fileData = fileDataMap.get(transferId);
        if (fileData) {
          // Copy chunk data to the correct position
          const chunkArray = new Uint8Array(chunk as ArrayBuffer);
          fileData.data.set(chunkArray, offset);

          // Update progress
          const progress = Math.round((chunkNumber / totalChunks) * 100);
          setTransfers(prev =>
            prev.map(t =>
              t.id === transferId && 'progress' in t
                ? { ...t, progress, status: 'transferring' }
                : t
            )
          );

          // If this is the last chunk, mark as complete
          if (chunkNumber === totalChunks) {
            setTransfers(prev =>
              prev.map(t =>
                t.id === transferId && 'progress' in t
                  ? { ...t, progress: 100, status: 'completed' }
                  : t
              )
            );
            pendingTransfers.delete(transferId);
          }
        }
      } catch (error) {
        console.error('Error handling file chunk:', error);
      }
    });

    socket.on('transfer:complete', ({ transferId }) => {
      console.log('Transfer complete:', transferId);
      setTransfers(prev =>
        prev.map(t =>
          t.id === transferId && 'progress' in t
            ? { ...t, progress: 100, status: 'completed' }
            : t
        )
      );
      pendingTransfers.delete(transferId);
    });

    return () => {
      socket.off('transfer:received');
      socket.off('transfer:file');
      socket.off('transfer:progress');
      socket.off('room:left');
      socket.off('transfer:chunk');
      socket.off('transfer:complete');
    };
  }, [socket, transfers, pendingTransfers, fileDataMap]);

  const downloadFile = (transferId: string) => {
    const fileData = fileDataMap.get(transferId);
    if (!fileData) {
      console.error('File data not found for transfer:', transferId); // Debug log
      return;
    }

    try {
      const blob = new Blob([fileData.data], { type: fileData.fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.fileName;
      a.click();
      URL.revokeObjectURL(url);

      // Remove file data after download
      fileDataMap.delete(transferId);
    } catch (error) {
      console.error('Error downloading file:', error); // Debug log
    }
  };

  const sendFile = async (file: File, receiverId: string): Promise<string> => {
    if (!connectionState.connected || !socket) {
      throw new Error('Not connected to a room');
    }

    if (!socket.id) {
      throw new Error('Socket not initialized properly');
    }

    // Find the receiver device
    const receiver = connectionState.devices.find(d => d.id === receiverId);
    if (!receiver) {
      console.error('Receiver not found:', receiverId);
      throw new Error('Receiver not found');
    }

    console.log('Found receiver for file transfer:', receiver);

    // Find the current device's ID
    const currentDevice = connectionState.devices.find(d => d.socketId === socket.id);
    if (!currentDevice) {
      console.error('Current device not found in room');
      throw new Error('Current device not found in room');
    }

    const transfer: FileTransfer = {
      id: `file_${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      senderId: currentDevice.id,
      receiverId,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    console.log('Starting file transfer:', transfer);

    // Add to local transfers first
    setTransfers(prev => [...prev, transfer]);

    // Send transfer metadata first and wait for acknowledgment
    return new Promise((resolve, reject) => {
      socket.emit('transfer:start', {
        transfer,
        receiverId
      });

      // Read and send the file in chunks
      const chunkSize = 64 * 1024; // 64KB chunks
      let offset = 0;
      let chunksSent = 0;
      const totalChunks = Math.ceil(file.size / chunkSize);

      const readNextChunk = () => {
        const chunk = file.slice(offset, offset + chunkSize);
        const reader = new FileReader();

        reader.onload = (e) => {
          const chunkData = e.target?.result;
          if (chunkData) {
            console.log('Sending file chunk:', { 
              transferId: transfer.id,
              offset,
              total: file.size,
              chunkSize: chunkData.byteLength,
              chunkNumber: chunksSent + 1,
              totalChunks
            });

            socket.emit('transfer:chunk', {
              transferId: transfer.id,
              chunk: chunkData,
              offset,
              total: file.size,
              chunkNumber: chunksSent + 1,
              totalChunks,
              receiverId
            });

            offset += chunkData.byteLength;
            chunksSent++;
            const progress = Math.round((offset / file.size) * 100);
            
            // Update progress
            setTransfers(prev =>
              prev.map(t =>
                t.id === transfer.id && 'progress' in t
                  ? { ...t, progress, status: 'transferring' }
                  : t
              )
            );

            if (offset < file.size) {
              // Read next chunk
              readNextChunk();
            } else {
              // File transfer complete
              console.log('File transfer complete:', transfer.id);
              socket.emit('transfer:complete', {
                transferId: transfer.id,
                receiverId
              });
              resolve(transfer.id);
            }
          } else {
            reject(new Error('Failed to read file chunk'));
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file chunk'));
        };

        reader.readAsArrayBuffer(chunk);
      };

      // Start reading chunks
      readNextChunk();
    });
  };

  const sendText = async (content: string, receiverId: string, type: 'text' | 'link'): Promise<string> => {
    if (!connectionState.connected || !socket) {
      throw new Error('Not connected to a room');
    }

    if (!socket.id) {
      throw new Error('Socket not initialized properly');
    }

    // Find the receiver device
    const receiver = connectionState.devices.find(d => d.id === receiverId);
    if (!receiver) {
      console.error('Receiver not found:', receiverId);
      throw new Error('Receiver not found');
    }

    console.log('Found receiver:', receiver);
    console.log('Current socket ID:', socket.id);

    // Find the current device's ID
    const currentDevice = connectionState.devices.find(d => d.socketId === socket.id);
    if (!currentDevice) {
      console.error('Current device not found in room');
      throw new Error('Current device not found in room');
    }

    const transfer: TextTransfer = {
      id: `text_${Date.now()}`,
      content,
      type,
      senderId: currentDevice.id,
      receiverId: receiver.id,
      createdAt: new Date()
    };

    console.log('Sending text transfer:', transfer);

    // Add to local transfers first
    setTransfers(prev => [...prev, transfer]);

    // Then emit to server
    socket.emit('transfer:text', {
      transfer,
      receiverId: receiver.id
    });

    return transfer.id;
  };

  const clearTransfers = () => {
    setTransfers([]);
  };

  return (
    <TransferContext.Provider value={{
      transfers,
      clearTransfers,
      sendText,
      sendFile,
      downloadFile
    }}>
      {children}
    </TransferContext.Provider>
  );
};

export const useTransfer = (): TransferContextType => {
  const context = useContext(TransferContext);
  if (context === undefined) {
    throw new Error('useTransfer must be used within a TransferProvider');
  }
  return context;
};