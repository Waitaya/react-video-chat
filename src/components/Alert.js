import React from "react";

const Alert = ({ message, onClick }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div className="bg-white p-4 rounded shadow-md">
        <p className="text-lg">{message}</p>
        <button
          onClick={onClick}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Accepted
        </button>
      </div>
    </div>
  );
};

export default Alert;
