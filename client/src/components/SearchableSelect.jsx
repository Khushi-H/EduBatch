import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

/**
 * A single input that lets you type to filter options AND pick one — no
 * separate search field + dropdown pair. Click/focus opens the option list,
 * typing filters it live, selecting an option shows its label in the input
 * and closes the list.
 *
 * options: [{ value, label, sublabel? }]
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  emptyText = "No matches",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.sublabel?.toLowerCase().includes(q),
    );
  }, [options, query]);

  function pick(opt) {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  }

  function clearSelection(e) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
    setOpen(true);
  }

  // While open, the input shows the live search query. While closed (and
  // something is picked), it shows the selected option's label instead.
  const displayValue = open ? query : selected?.label || "";

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`input flex items-center gap-2 cursor-text ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search size={15} className="text-ink-400/70 shrink-0" />
        <input
          ref={inputRef}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-ink-400/60"
          placeholder={selected ? selected.label : placeholder}
          value={displayValue}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange("");
          }}
        />
        {selected && !open && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-ink-300 hover:text-ink-600 shrink-0"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown
          size={14}
          className={`text-ink-300 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full max-h-64 overflow-auto rounded-xl border border-ink-100 bg-white shadow-soft py-1">
          {filtered.length === 0 ? (
            <div className="px-3.5 py-3 text-sm text-ink-400">{emptyText}</div>
          ) : (
            filtered.map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => pick(o)}
                className={`w-full text-left px-3.5 py-2.5 text-sm hover:bg-amber-50 transition ${
                  o.value === value
                    ? "bg-amber-50 text-amber-700"
                    : "text-ink-700"
                }`}
              >
                <div className="font-medium">{o.label}</div>
                {o.sublabel && (
                  <div className="text-xs text-ink-400">{o.sublabel}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
