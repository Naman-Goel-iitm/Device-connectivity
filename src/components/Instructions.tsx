import React from 'react';
import { Wifi, PlusSquare, Share2, MessageSquare, ShieldCheck } from 'lucide-react';

const Instructions: React.FC = () => {
  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold text-blue-500 mb-4">How it works</h2>
      <div className="flex items-start space-x-4">
        <Wifi className="h-6 w-6 text-white mt-1" />
        <p>"Connect your devices in one go"</p>
      </div>
      <div className="flex items-start space-x-4">
        <PlusSquare className="h-6 w-6 text-white mt-1" />
        <p>"Create a new room and join with other device"</p>
      </div>
      <div className="flex items-start space-x-4">
        <Share2 className="h-6 w-6 text-white mt-1" />
        <p>"Share the Room Code"</p>
      </div>
      <div className="flex items-start space-x-4">
        <MessageSquare className="h-6 w-6 text-white mt-1" />
        <p>"Do Annonymous chat, Transfer FIles, share links"</p>
      </div>
      <div className="flex items-start space-x-4">
        <ShieldCheck className="h-11 w-11 text-white" />
        <p>
          <span className="font-bold">"None of your data would be stored or shared anywhere, </span>
           all the chat you do or file you transfer would be store in your RAM and would be clear once you leave the room."
        </p>
      </div>
    </div>
  );
};

export default Instructions; 