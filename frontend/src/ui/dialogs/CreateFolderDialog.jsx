import { useState } from "react";
import { Dialog } from "../components/Dialog.jsx";
import { TextInput } from "../components/TextInput.jsx";
import { Button } from "../components/Button.jsx";

export function CreateFolderDialog({ open, onClose, onCreate, parentId }) {
  const [name, setName] = useState("");

  return (
    <Dialog
      open={open}
      title="New folder"
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
              onCreate?.({ name: trimmed, parent_id: parentId ?? null });
              setName("");
            }}
            type="button"
          >
            Create
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <div className="text-sm text-slate-600">Folder name</div>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Photos" />
      </div>
    </Dialog>
  );
}

