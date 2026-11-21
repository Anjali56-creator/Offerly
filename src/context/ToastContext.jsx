import { createContext, useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  // the toast disappears after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(message, onUndo) {
    setToast({ message, onUndo });
  }

  function handleUndo() {
    toast.onUndo();
    setToast(null);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <>
              <span>·</span>
              <button className="toast-link" onClick={handleUndo}>
                Undo
              </button>
            </>
          )}
          <span>·</span>
          <Link to="/my-internships" className="toast-link" onClick={() => setToast(null)}>
            View
          </Link>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
