import React, { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

interface Option {
  label: string;
  value: string;
}

interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  className?: string;
}

const FilterDropdown: React.FC<Props> = ({
  label,
  value,
  options,
  onChange,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected =
    options.find((o) => o.value === value)?.label || label;

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      className={`relative w-full sm:w-48 ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white
                   hover:bg-gray-50 dark:hover:bg-gray-700
                   focus:ring-2 focus:ring-[#4F46E5] outline-none
                   text-left flex justify-between items-center"
      >
        <span className="truncate">{selected}</span>
        <span className="ml-2 text-gray-400"><FiChevronDown size={16} /></span>
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1 w-full rounded-lg border
                     border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left
                hover:bg-gray-100 dark:hover:bg-gray-700
                ${
                  opt.value === value
                    ? "font-medium text-[#4F46E5]"
                    : "text-gray-700 dark:text-gray-300"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
