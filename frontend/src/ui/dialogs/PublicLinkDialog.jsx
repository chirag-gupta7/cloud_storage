import { useState } from "react";
import { Dialog } from "../components/Dialog.jsx";
import { TextInput } from "../components/TextInput.jsx";
import { Button } from "../components/Button.jsx";

export function PublicLinkDialog({ open, onClose, onCreate, createdUrl }) {
  const [password, setPassword] = useState("");
  const [expiresHours, setExpiresHours] = useState("");

  return (
    <Dialog
      open={open}
      title="Create public link"
      onClose={() => {
        setPassword("");
        setExpiresHours("");
        onClose?.();
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">Close</Button>
          <Button
            onClick={() => {
              const hours = expiresHours.trim() ? Number(expiresHours) : null;
              onCreate?.({
                password: password.trim() ? password : null,
                expires_in_hours: Number.isFinite(hours) && hours > 0 ? hours : null,
              });
            }}
            type="button"
          >
            Create
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {createdUrl ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-medium text-slate-900">Shareable link</div>
            <div className="mt-1 break-all text-xs text-slate-600">{createdUrl}</div>
            <div className="mt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => navigator.clipboard?.writeText(createdUrl)}>
                Copy link
              </Button>
            </div>
          </div>
        ) : null}
        <div className="grid gap-2">
          <div className="text-sm text-slate-700">Expiry (hours, optional)</div>
          <TextInput inputMode="numeric" value={expiresHours} onChange={(e) => setExpiresHours(e.target.value)} placeholder="e.g. 24" />
        </div>
        <div className="grid gap-2">
          <div className="text-sm text-slate-700">Password (optional)</div>
          <TextInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave empty for no password" />
        </div>
      </div>
    </Dialog>
  );
}
