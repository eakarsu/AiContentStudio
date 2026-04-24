import { FiAlertTriangle, FiX } from 'react-icons/fi';

export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Delete', confirmColor = 'red', onConfirm, onCancel }) {
  if (!isOpen) return null;

  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-200',
    yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-200',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-200',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiAlertTriangle className="text-red-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title || 'Confirm Action'}</h3>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">{message || 'Are you sure you want to proceed?'}</p>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-white font-medium rounded-lg transition-colors focus:ring-4 ${colorClasses[confirmColor] || colorClasses.red}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
