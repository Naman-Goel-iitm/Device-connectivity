import React, { useState } from 'react';
import { Clock, FileText, Link as LinkIcon, Check, X, MessageSquare, Download, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useTransfer } from '../context/TransferContext';
import { formatFileSize, isMobileDevice } from '../utils/deviceUtils';
import { useConnection } from '../context/ConnectionContext';
import { formatTime } from '../utils/date';

const TransferHistory: React.FC = () => {
  const { transfers, clearTransfers, downloadFile } = useTransfer();
  const { connectionState } = useConnection();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDownloadToast, setShowDownloadToast] = useState(false);
  
  if (!connectionState.connected || transfers.length === 0) {
    return null;
  }
  
  // Sort transfers by creation date, newest first
  const sortedTransfers = [...transfers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (transferId: string) => {
    downloadFile(transferId);
    if (isMobileDevice()) {
      setShowDownloadToast(true);
      setTimeout(() => setShowDownloadToast(false), 2000);
    }
  };

  const getTransferIcon = (transfer: any) => {
    if ('fileName' in transfer) return <FileText className="h-5 w-5 text-blue-500" />;
    if ('content' in transfer) {
      if (transfer.type === 'link') return <LinkIcon className="h-5 w-5 text-purple-500" />;
      return <MessageSquare className="h-5 w-5 text-green-500" />;
    }
    return null;
  };

  const getTransferContent = (transfer: any) => {
    if ('fileName' in transfer) {
      return (
        <>
          <p className="text-sm font-medium text-gray-900 truncate">
            {transfer.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(transfer.fileSize)}
          </p>
        </>
      );
    }
    
    if ('content' in transfer) {
      if (transfer.type === 'link') {
        return (
          <div className="flex items-center gap-2">
            <a 
              href={transfer.content} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline truncate"
            >
              {transfer.content}
            </a>
            <button
              onClick={() => handleCopy(transfer.content, transfer.id)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Copy link"
            >
              {copiedId === transfer.id ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <span className="truncate">{transfer.content}</span>
            <button
              onClick={() => handleCopy(transfer.content, transfer.id)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Copy text"
            >
              {copiedId === transfer.id ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        );
      }
    }
    
    return null;
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-500" />
          Recent Transfers
        </CardTitle>
        <button 
          onClick={clearTransfers}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear All
        </button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {sortedTransfers.map(transfer => (
            <li 
              key={transfer.id} 
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  {getTransferIcon(transfer)}
                </div>
                
                <div className="flex-1 min-w-0">
                  {getTransferContent(transfer)}
                  
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTime(new Date(transfer.createdAt))}
                    </span>
                    
                    {'progress' in transfer && (
                      <div className="ml-2 flex items-center">
                        {transfer.status === 'completed' && (
                          <span className="flex items-center text-xs text-green-600">
                            <Check size={12} className="mr-1" />
                            Completed
                          </span>
                        )}
                        
                        {transfer.status === 'transferring' && (
                          <span className="flex items-center text-xs text-blue-600">
                            <div className="mr-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            {transfer.progress}%
                          </span>
                        )}
                        
                        {transfer.status === 'failed' && (
                          <span className="flex items-center text-xs text-red-600">
                            <X size={12} className="mr-1" />
                            Failed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {'progress' in transfer && transfer.progress === 100 && (
                <div className="flex items-center justify-end mt-2">
                  <button
                    onClick={() => handleDownload(transfer.id)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
      {showDownloadToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          Download started!
        </div>
      )}
    </Card>
  );
};

export default TransferHistory;