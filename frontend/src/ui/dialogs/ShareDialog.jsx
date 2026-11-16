import { useMemo, useState } from "react";
import { Dialog } from "../components/Dialog.jsx";
import { TextInput } from "../components/TextInput.jsx";
import { Select } from "../components/Select.jsx";
import { Button } from "../components/Button.jsx";

export function ShareDialog({ open, onClose, onShare, target }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("viewer");

  const title = useMemo(() => {
    if (!target) return "Share";
    return target.type === "folder" ? `Share folder` : `Share file`;
  }, [target]);

  return (
    <Dialog
      open={open}
      title={title}
      onClose={() => {
        setEmail("");
        setPermission("viewer");
        onClose?.();
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={() => {
              const trimmed = email.trim();
              if (!trimmed) return;
              onShare?.({ shared_with_email: trimmed, permission });
              setEmail("");
            }}
            type="button"
          >
            Share
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="text-sm text-slate-600">Enter the email address of the person you want to share with.</div>
        <div className="grid gap-2">
          <div className="text-sm text-slate-700">User email</div>
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. teammate@example.com" />
        </div>
        <div className="grid gap-2">
          <div className="text-sm text-slate-700">Permission</div>
          <Select value={permission} onChange={(e) => setPermission(e.target.value)}>
            <option value="viewer">Viewer (read-only)</option>
            <option value="editor">Editor</option>
          </Select>
        </div>
      </div>
    </Dialog>
  );
}
