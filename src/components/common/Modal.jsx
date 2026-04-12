import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

/**
 * A reusable Modal component that uses React Portals to render into document.body.
 * This ensures the modal is not clipped by parent containers with overflow: hidden or position: relative.
 */
const Modal = ({ children, onClose, isOpen }) => {
  useEffect(() => {
    if (isOpen) {
      // Disable background scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      // Restore background scroll
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-root">
      {/* Overlay Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal Content Wrapper */}
      <div className="modal-content-wrapper">
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
