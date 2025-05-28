import React, { useState } from 'react';
import { Plus, Wifi, Copy, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useConnection } from '../context/ConnectionContext';
import { formatRoomCode, validateRoomCode } from '../utils/roomUtils';

const ConnectSection: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [showCodeCopied, setShowCodeCopied] = useState(false);
  
  const { 
    connectionState, 
    createRoom, 
    joinRoom, 
    leaveRoom,
    isConnecting,
    error 
  } = useConnection();

  const handleCreateRoom = async () => {
    try {
      const code = await createRoom();
      // Code created successfully
    } catch (err) {
      // Error handled in context
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode) {
      setCodeError('Please enter a room code');
      return;
    }
    
    const formattedCode = roomCode.replace(/\s/g, '').toUpperCase();
    
    if (!validateRoomCode(formattedCode)) {
      setCodeError('Invalid room code format. Please enter a 6-character code.');
      return;
    }
    
    setCodeError(null);
    
    try {
      const success = await joinRoom(formattedCode);
      if (!success) {
        setCodeError('Could not join room. Please check the code and try again.');
      }
    } catch (err) {
      // Error handled in context
    }
  };

  const copyRoomCode = () => {
    if (connectionState.room?.code) {
      navigator.clipboard.writeText(connectionState.room.code);
      setShowCodeCopied(true);
      setTimeout(() => setShowCodeCopied(false), 2000);
    }
  };

  // If not connected to a room, show connection options
  if (!connectionState.connected) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="mr-2 h-5 w-5 text-blue-500" />
              Connect Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="primary" 
                fullWidth 
                leftIcon={<Plus size={18} />}
                onClick={handleCreateRoom}
                isLoading={isConnecting}
              >
                Create New Room
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or join with code</span>
                </div>
              </div>
              
              <Input
                placeholder="Enter 6-digit room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                error={codeError || undefined}
                fullWidth
              />
              
              <Button 
                variant="outline" 
                fullWidth
                onClick={handleJoinRoom}
                isLoading={isConnecting}
              >
                Join Room
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            Up to 3 devices can connect to a room
          </CardFooter>
        </Card>
        
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }
  
  // If connected to a room, show room info
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wifi className="mr-2 h-5 w-5 text-green-500" />
          Connected Room
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
            <span className="text-sm text-gray-500 mb-1">Room Code</span>
            <div className="relative">
              <h2 className="text-2xl font-mono font-bold tracking-wider">
                {formatRoomCode(connectionState.room?.code || '')}
              </h2>
              <button
                onClick={copyRoomCode}
                className="absolute -right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Copy code"
              >
                <Copy size={16} />
              </button>
            </div>
            {showCodeCopied && (
              <span className="text-xs text-green-600 mt-1">Copied!</span>
            )}
          </div>
          
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Users size={16} className="mr-1" />
              <span>Connected Devices ({connectionState.devices.length}/3)</span>
            </div>
            <ul className="space-y-2">
              {connectionState.devices.map(device => (
                <li 
                  key={device.id} 
                  className="p-2 bg-white border border-gray-200 rounded flex items-center"
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${device.isHost ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <span className="flex-1">{device.name}</span>
                  <span className="text-xs text-gray-500">
                    {device.isHost ? 'Host' : 'Connected'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          fullWidth
          onClick={() => window.confirm('Leave this room?') && leaveRoom()}
        >
          Leave Room
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConnectSection;