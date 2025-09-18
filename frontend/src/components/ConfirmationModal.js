import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirmation-overlay" onClick={onClose}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`confirmation-header ${type}`}>
          <div className="confirmation-icon">
            {type === 'danger' && '⚠️'}
            {type === 'warning' && '❓'}
            {type === 'info' && 'ℹ️'}
          </div>
          <h3>{title}</h3>
        </div>

        <div className="confirmation-body">
          <p>{message}</p>
        </div>

        <div className="confirmation-footer">
          <button
            className="confirmation-btn cancel-btn"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={`confirmation-btn confirm-btn ${type}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;