import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function FormField({ label, id, labelClass = "", action, prefix, hint, type = "text", className = "", ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className={`text-[11px] font-semibold text-neutral-800 ${labelClass}`}>
          {label}
        </label>
        {action}
      </div>

      <div className="flex items-center rounded-sm bg-stone-100 focus-within:ring-2 focus-within:ring-maroon/30">
        {prefix && <span className="pl-3 text-xs font-semibold text-neutral-700">{prefix}</span>}
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          {...props}
          className="w-full bg-transparent px-3 py-2.5 text-xs text-neutral-900 placeholder:text-stone-400 focus:outline-none"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="px-3 text-neutral-700"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {hint && <p className="mt-1 text-[11px] text-neutral-500">{hint}</p>}
    </div>
  );
}