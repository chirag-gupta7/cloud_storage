import { Dialog } from "../components/Dialog.jsx";
import { Button } from "../components/Button.jsx";

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", danger, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} type="button">
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{description}</div>
    </Dialog>
  );
}

