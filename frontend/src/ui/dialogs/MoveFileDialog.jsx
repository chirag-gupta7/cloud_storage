import { Dialog } from "../components/Dialog.jsx";
import { Select } from "../components/Select.jsx";
import { Button } from "../components/Button.jsx";
import { useState } from "react";

export function MoveFileDialog({ open, onClose, file, folders, onMove }) {
  const [target, setTarget] = useState("__root__");

  return (
    <Dialog
      open={open}
      title="Move file"
      onClose={() => {
        setTarget("__root__");
        onClose?.();
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (target === "__root__") onMove?.(null);
              else onMove?.(Number(target));
            }}
            type="button"
          >
            Move
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="text-sm text-slate-600">Select destination folder for: <span className="font-medium text-slate-900">{file?.name || ""}</span></div>
        <Select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="__root__">My Drive (root)</option>
          {folders.map((f) => (
            <option key={f.id} value={String(f.id)}>
              {f.name}
            </option>
          ))}
        </Select>
      </div>
    </Dialog>
  );
}
