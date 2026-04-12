import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { AlertCircle, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import "./AlertModal.css";

const AlertModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info", // "info", "warning", "error", "confirm"
  confirmText = "Confirm",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
        return <AlertCircle className="alert-icon warning" size={48} />;
      case "error":
        return <XCircle className="alert-icon error" size={48} />;
      case "success":
        return <CheckCircle className="alert-icon success" size={48} />;
      case "confirm":
        return <HelpCircle className="alert-icon confirm" size={48} />;
      default:
        return <AlertCircle className="alert-icon info" size={48} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="alert-modal-content">
        <div className="alert-modal-body">
          <div className="alert-icon-container">
            {getIcon()}
          </div>
          <h3 className="alert-modal-title">{title}</h3>
          <p className="alert-modal-message">{message}</p>
        </div>

        <div className="alert-modal-actions">
          {type === "confirm" ? (
            <>
              <Button variant="secondary" onClick={onClose}>
                {cancelText}
              </Button>
              <Button variant="primary" onClick={() => { onConfirm(); onClose(); }}>
                {confirmText}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={onClose}>
              OK
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AlertModal;
