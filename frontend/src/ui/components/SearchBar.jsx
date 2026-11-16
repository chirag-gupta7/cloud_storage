import { Search, X } from "lucide-react";
import { TextInput } from "./TextInput.jsx";
import { Select } from "./Select.jsx";
import { IconButton } from "./IconButton.jsx";

export function SearchBar({ value, onChange, mimeType, onMimeTypeChange, placeholder = "Search files…" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[260px] flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <TextInput className="pl-9 pr-10" value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} />
        {value ? (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <IconButton title="Clear" onClick={() => onChange?.("")} type="button">
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        ) : null}
      </div>
      <div className="w-[220px]">
        <Select value={mimeType || ""} onChange={(e) => onMimeTypeChange?.(e.target.value || null)}>
          <option value="">All types</option>
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPEG</option>
          <option value="application/pdf">PDF</option>
          <option value="text/plain">Text</option>
          <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">DOCX</option>
        </Select>
      </div>
    </div>
  );
}

