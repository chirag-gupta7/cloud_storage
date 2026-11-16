import { useMemo, useState } from "react";
import { Dialog } from "../components/Dialog.jsx";
import { Select } from "../components/Select.jsx";
import { Button } from "../components/Button.jsx";

export function MoveFolderDialog({ open, onClose, folder, folders, onMove }) {
  const [target, setTarget] = useState("__root__");

  const options = useMemo(() => {
    const currentId = folder?.id;
    return (folders || []).filter((f) => String(f.id) !== String(currentId));
  }, [folders, folder]);

  return (
    <Dialog
      open={open}
      title="Move folder"
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
        <div className="text-sm text-slate-600">
          Select destination folder for: <span className="font-medium text-slate-900">{folder?.name || ""}</span>
        </div>
        <Select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="__root__">My Drive (root)</option>
          {options.map((f) => (
            <option key={f.id} value={String(f.id)}>
              {f.name}
            </option>
          ))}
        </Select>
      </div>
    </Dialog>
  );
}

