// src/components/Popup.tsx
import React, { useState } from 'react';

interface PopupProps {
  onClose: () => void;
  onDelete: (username: string) => void;
}

const RequestPopup: React.FC<PopupProps> = ({ onClose, onDelete }) => {
  const [username, setUsername] = useState('');

  const handleDelete = () => {
    onDelete(username);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl mb-4">Delete User</h2>
        <input
          type="text"
          className="border border-gray-300 p-2 w-full mb-4"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="flex justify-end">
          <button className="bg-red-500 text-white px-4 py-2 rounded mr-2" onClick={handleDelete}>
            Delete
          </button>
          <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestPopup;
