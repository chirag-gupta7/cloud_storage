import { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

export function UploadDropzone({ disabled, onFiles }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    disabled,
    multiple: true,
    onDrop: (acceptedFiles) => onFiles?.(acceptedFiles),
  });

  const classes = useMemo(() => {
    const base =
      "rounded-lg border border-dashed bg-white p-4 text-sm transition flex items-center justify-between gap-4";
    if (disabled) return `${base} border-slate-200 text-slate-400`;
    if (isDragActive) return `${base} border-slate-400 bg-slate-50 text-slate-700`;
    return `${base} border-slate-200 text-slate-700 hover:border-slate-300`;
  }, [disabled, isDragActive]);

  return (
    <div {...getRootProps({ className: classes })}>
      <input {...getInputProps()} />
      <div>
        <div className="font-medium text-slate-900">Upload files</div>
        <div className="mt-0.5 text-slate-600">Drag & drop, or click to select.</div>
      </div>
      <Upload className="h-5 w-5 text-slate-500" />
    </div>
  );
}

