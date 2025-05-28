import React, { useRef, useState } from 'react';
import { File, Send, Link, Clipboard, ArrowUpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useConnection } from '../context/ConnectionContext';
import { useTransfer } from '../context/TransferContext';
import { formatFileSize } from '../utils/deviceUtils';

const TransferSection: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [isLink, setIsLink] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const { connectionState, socket } = useConnection();
  const { sendFile, sendText } = useTransfer();
  
  // Not connected, don't show transfer UI
  if (!connectionState.connected) {
    return null;
  }
  
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Get first connected device that isn't the current one
    const receiver = connectionState.devices.find(d => d.socketId !== socket?.id);
    
    if (!receiver) {
      alert('No devices connected to send files to');
      return;
    }
    
    // For demo, we'll just send the first file
    sendFile(files[0], receiver.id)
      .then(() => {
        // File transfer initiated
      })
      .catch(err => {
        console.error('Error sending file:', err);
        alert('Failed to send file. Please try again.');
      });
  };
  
  const handleTextSend = () => {
    if (!text.trim()) return;
    
    // Get first connected device that isn't the current one
    const receiver = connectionState.devices.find(d => d.socketId !== socket?.id);
    
    if (!receiver) {
      alert('No devices connected to send text to');
      return;
    }
    
    console.log('Selected receiver:', receiver); // Debug log
    
    sendText(text, receiver.id, isLink ? 'link' : 'text')
      .then(() => {
        setText('');
        setIsLink(false);
      })
      .catch(err => {
        console.error('Error sending text:', err);
        alert('Failed to send text. Please try again.');
      });
  };
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        // Check for text
        if (clipboardItem.types.includes('text/plain')) {
          const blob = await clipboardItem.getType('text/plain');
          const text = await blob.text();
          setText(text);
          return;
        }
        
        // Check for images
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], `clipboard-image.${type.split('/')[1]}`, { type });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            handleFilesSelected(dataTransfer.files);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard contents:', err);
      alert('Could not access clipboard. Please paste manually or try another method.');
    }
  };
  
  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <File className="mr-2 h-5 w-5 text-blue-500" />
            Send Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <ArrowUpCircle 
              className={`mx-auto h-12 w-12 mb-2 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} 
            />
            <p className="text-sm text-gray-600 mb-1">
              Drag files here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports images, documents, videos and more
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="mr-2 h-5 w-5 text-blue-500" />
            Send Text or Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Button
                variant={!isLink ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setIsLink(false)}
              >
                Text
              </Button>
              <Button
                variant={isLink ? 'primary' : 'outline'}
                size="sm"
                leftIcon={<Link size={16} />}
                onClick={() => setIsLink(true)}
              >
                Link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Clipboard size={16} />}
                onClick={handlePasteFromClipboard}
              >
                Paste
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder={isLink ? "Enter URL to share..." : "Type or paste text..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                fullWidth
              />
              <Button
                onClick={handleTextSend}
                disabled={!text.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransferSection;