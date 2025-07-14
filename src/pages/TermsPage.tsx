import React from 'react';

const TermsPage: React.FC = () => (
  <div className="max-w-2xl mx-auto px-4 py-12 text-gray-800">
    <h1 className="text-3xl font-bold mb-6 text-blue-700">Terms and Conditions</h1>
    <p className="mb-4 text-sm text-gray-500">Last updated: [14-07-2025]</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">1. Introduction</h2>
    <p className="mb-4">Welcome to Winddrop (“we”, “us”, “our”, or “the Service”). By using our file and text transfer service, you (“user”, “you”, “your”) agree to these Terms and Conditions. Please read them carefully before using the Service.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">2. Core Principles</h2>
    <ul className="list-disc pl-6 mb-4">
      <li><b>No Data Collection:</b> We do <b>not</b> collect, store, or process any files, texts, or links transferred through our service.</li>
      <li><b>No Database:</b> We do <b>not</b> use any database to store your files, messages, or room information.</li>
      <li><b>No User Accounts:</b> You are not required to create an account or provide personal information to use the Service.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">3. How Transfers Work</h2>
    <ul className="list-disc pl-6 mb-4">
      <li><b>Direct Device-to-Device:</b> All transfers are conducted in real-time between connected devices using WebSocket technology.</li>
      <li><b>Temporary In-Memory Storage:</b> Files and messages are temporarily held in the server’s RAM (memory) only for the duration of the transfer session.</li>
      <li><b>Automatic Deletion:</b> Once a transfer is complete or a user leaves the room, all associated data is immediately deleted from memory. No trace is left on the server.</li>
      <li><b>No Persistent Storage:</b> We do not write any transferred data to disk, nor do we back up or archive any user content.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">4. Logs</h2>
    <ul className="list-disc pl-6 mb-4">
      <li><b>Minimal Logging:</b> For debugging and operational purposes, we may log metadata such as timestamps, file names, and transfer status (e.g., “transfer started”, “transfer completed”).</li>
      <li><b>No Content Logging:</b> The actual content of files is <b>never</b> logged. Text and links may appear in logs for a short period for debugging, but these logs are automatically flushed and not retained.</li>
      <li><b>Log Retention:</b> Logs are periodically cleared and are not used for analytics, profiling, or any form of data mining.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">5. Security</h2>
    <ul className="list-disc pl-6 mb-4">
      <li><b>End-to-End Security:</b> Transfers are conducted over secure, encrypted channels (HTTPS/WSS).</li>
      <li><b>No Access to Content:</b> We do not access, view, or analyze the content of your files, texts, or links.</li>
      <li><b>Session Isolation:</b> Each transfer session (room) is isolated. Only devices in the same room can exchange data.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">6. User Responsibilities</h2>
    <ul className="list-disc pl-6 mb-4">
      <li><b>Legal Use Only:</b> You agree not to use the Service for any unlawful, harmful, or malicious activities, including but not limited to sharing illegal, copyrighted, or offensive material.</li>
      <li><b>File Size Limits:</b> The maximum file size for transfer is 150MB. Attempts to transfer larger files will be rejected.</li>
      <li><b>Session Management:</b> You are responsible for ensuring you leave the room after your transfer is complete to ensure all temporary data is deleted.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">7. Limitations and Disclaimers</h2>
    <ul className="list-disc pl-6 mb-4">
      <li><b>No Guarantee of Delivery:</b> While we strive for reliable transfers, we do not guarantee that all files or messages will be delivered or received without error.</li>
      <li><b>No Liability for Data Loss:</b> We are not responsible for any data loss, corruption, or unauthorized access resulting from your use of the Service.</li>
      <li><b>No Recovery:</b> Once a transfer session ends or a user leaves the room, all data is permanently deleted and cannot be recovered.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">8. Changes to the Service</h2>
    <ul className="list-disc pl-6 mb-4">
      <li>We may update, modify, or discontinue the Service at any time without notice.</li>
      <li>We may update these Terms and Conditions from time to time. Continued use of the Service constitutes acceptance of the updated terms.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">9. Contact</h2>
    <p className="mb-4">If you have questions or concerns about these Terms and Conditions, please contact us at <a href="mailto:naman.goel1904@gmail.com" className="text-blue-600 underline">naman.goel1904@gmail.com</a>.</p>
    <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800">
      <b>Key Highlights for Users</b>
      <ul className="list-disc pl-6 mt-2">
        <li>We do not store your files or messages.</li>
        <li>No database, no user accounts, no tracking.</li>
        <li>Everything is deleted from memory as soon as you leave the room.</li>
        <li>Your privacy and security are our top priorities.</li>
      </ul>
    </div>
  </div>
);

export default TermsPage; 