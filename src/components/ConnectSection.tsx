import React, { useState } from 'react';
import { Wifi, Copy, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useConnection } from '../context/ConnectionContext';
import { formatRoomCode } from '../utils/roomUtils';

const ConnectSection: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCodeCopied, setShowCodeCopied] = useState(false);
  
  const { 
    connectionState, 
    createRoom, 
    joinRoom, 
    leaveRoom,
    error: contextError 
  } = useConnection();

  const handleCreateRoom = async () => {
    try {
      const newRoomId = await createRoom();
      setRoomId(newRoomId);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    try {
      await joinRoom(roomId);
      setError(null);
    } catch (error) {
      setError('Failed to join room. Please check the room ID and try again.');
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
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleJoinRoom}>
                  Join
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCreateRoom}
                className="w-full"
              >
                Create New Room
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            Up to 3 devices can connect to a room
          </CardFooter>
        </Card>
        
        {contextError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {contextError}
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