import { useApp } from '../context/AppContext';

export default function ToastContainer() {
  const { state } = useApp();
  const { toasts } = state;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
