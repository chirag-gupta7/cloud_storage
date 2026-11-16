import { useEffect, useState } from "react";
import { Dialog } from "../components/Dialog.jsx";
import { TextInput } from "../components/TextInput.jsx";
import { Button } from "../components/Button.jsx";

export function RenameFileDialog({ open, onClose, file, onRename }) {
  const [name, setName] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open && file) setName(file.name || "");
  }, [open, file]);

  return (
    <Dialog
      open={open}
      title="Rename file"
      onClose={() => {
        setName("");
        onClose?.();
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={() => {
              const trimmed = name.trim();
              if (!trimmed) return;
              onRename?.(trimmed);
            }}
            type="button"
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <div className="text-sm text-slate-600">New name</div>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} />
      </div>
    </Dialog>
  );
}
