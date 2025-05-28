import React, { useState, useRef } from 'react';
import { useTransfer } from '../context/TransferContext';
import { useConnection } from '../context/ConnectionContext';
import Button from './ui/Button';
import Input from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { FileText, Link, MessageSquare } from 'lucide-react';

export const TransferSection: React.FC = () => {
  const { sendText, sendFile } = useTransfer();
  const { connectionState, socket } = useConnection();
  const [text, setText] = useState('');
  const [isLink, setIsLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSend = async () => {
    if (!text.trim()) return;

    // Find a receiver that is not the current device
    const receiver = connectionState.devices.find(d => d.socketId !== socket?.id);
    if (!receiver) {
      console.error('No devices connected');
      return;
    }

    try {
      await sendText(text, receiver.id, isLink ? 'link' : 'text');
      setText('');
    } catch (error) {
      console.error('Error sending text:', error);
    }
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Find a receiver that is not the current device
    const receiver = connectionState.devices.find(d => d.socketId !== socket?.id);
    if (!receiver) {
      console.error('No devices connected');
      return;
    }

    try {
      await sendFile(files[0], receiver.id);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending file:', error);
    }
  };

  if (!connectionState.connected) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Files or Text</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={isLink ? 'outline' : 'primary'}
              onClick={() => setIsLink(false)}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              variant={isLink ? 'primary' : 'outline'}
              onClick={() => setIsLink(true)}
              className="flex-1"
            >
              <Link className="w-4 h-4 mr-2" />
              Link
            </Button>
          </div>

          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder={isLink ? "Paste a link..." : "Type a message..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextSend()}
              className="flex-1"
            />
            <Button onClick={handleTextSend}>
              Send
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFilesSelected}
              className="hidden"
              id="file-input"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Select File
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};