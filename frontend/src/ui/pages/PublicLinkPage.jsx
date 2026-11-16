import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { accessPublicFile, previewPublicFile } from "../../services/publicApi.js";
import { getErrorMessage } from "../../services/apiClient.js";
import { Button } from "../components/Button.jsx";
import { TextInput } from "../components/TextInput.jsx";

function isLikelyImage(url) {
  const lower = String(url || "").toLowerCase();
  return lower.includes("image") || lower.includes(".png") || lower.includes(".jpg") || lower.includes(".jpeg") || lower.includes(".webp");
}

export function PublicLinkPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const previewM = useMutation({
    mutationFn: () => previewPublicFile({ token, password: password.trim() ? password : undefined }),
    onSuccess: (data) => setPreviewUrl(data.preview_url),
  });

  const downloadM = useMutation({
    mutationFn: () => accessPublicFile({ token, password: password.trim() ? password : undefined }),
    onSuccess: (data) => setDownloadUrl(data.download_url),
  });

  const errorMessage = useMemo(() => {
    return getErrorMessage(previewM.error || downloadM.error);
  }, [previewM.error, downloadM.error]);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-4 text-sm">
          <Link className="text-slate-700 hover:underline" to="/login">
            Back to app
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Shared file</div>
          <div className="mt-1 text-sm text-slate-600">Public link token: <span className="font-mono text-xs">{token}</span></div>

          <div className="mt-4 grid gap-2">
            <div className="text-sm text-slate-700">Password (if required)</div>
            <TextInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave empty if not set" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => previewM.mutate()} disabled={previewM.isPending} type="button">
              {previewM.isPending ? "Loading…" : "Preview"}
            </Button>
            <Button onClick={() => downloadM.mutate()} disabled={downloadM.isPending} type="button">
              {downloadM.isPending ? "Loading…" : "Get download link"}
            </Button>
          </div>

          {(previewM.error || downloadM.error) ? (
            <div className="mt-4 text-sm text-rose-700">Error: {errorMessage}</div>
          ) : null}

          {downloadUrl ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-medium text-slate-900">Download</div>
              <div className="mt-1 break-all text-xs text-slate-600">{downloadUrl}</div>
              <div className="mt-2">
                <Button onClick={() => (window.location.href = downloadUrl)} type="button">
                  Download now
                </Button>
              </div>
            </div>
          ) : null}

          {previewUrl ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
              <div className="text-sm font-medium text-slate-900">Preview</div>
              <div className="mt-2 text-sm text-slate-600">
                <a className="text-slate-900 underline" href={previewUrl} target="_blank" rel="noreferrer">
                  Open preview in new tab
                </a>
              </div>
              {isLikelyImage(previewUrl) ? (
                <img className="mt-3 max-h-[640px] w-full rounded border border-slate-200 object-contain" src={previewUrl} alt="preview" />
              ) : (
                <iframe title="preview" className="mt-3 h-[640px] w-full rounded border border-slate-200" src={previewUrl} />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
