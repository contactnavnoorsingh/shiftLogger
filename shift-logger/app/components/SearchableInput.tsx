import React, { useState, useEffect, useRef } from 'react';

interface SearchableInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  data: string[];
}

const SearchableInput: React.FC<SearchableInputProps> = ({ placeholder, value, onChange, data }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect now only filters suggestions based on the input value.
    // It no longer controls whether the suggestion list is visible.
    if (value) {
      const filteredSuggestions = data
        .filter(item => item.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [value, data]);

  // This effect handles closing the suggestions when clicking outside the component.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // FIX: This function now correctly hides the suggestions after a selection is made.
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setShowSuggestions(false); // Explicitly hide suggestions on selection
  };

  return (
    <div style={{ position: 'relative' }} ref={wrapperRef}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)} // Show suggestions when the user focuses the input
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--card2)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          marginTop: '4px',
          zIndex: 10,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {suggestions.map(suggestion => (
            <div
              key={suggestion}
              onClick={() => handleSelect(suggestion)}
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
              }}
              className="suggestion-item"
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchableInput;
