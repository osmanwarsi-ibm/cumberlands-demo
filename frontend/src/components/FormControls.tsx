/**
 * Form control components
 */

import React, { ReactNode, ChangeEvent } from 'react';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'number';
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: TextInputProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontWeight: 600,
          marginBottom: '4px',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--rd)' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid var(--line)',
          borderRadius: '4px',
          fontFamily: 'var(--fb)',
          fontSize: '15px',
          background: 'var(--sf)',
          color: 'var(--ink)',
        }}
      />
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

export function Select({ label, value, onChange, options, required }: SelectProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontWeight: 600,
          marginBottom: '4px',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--rd)' }}> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid var(--line)',
          borderRadius: '4px',
          fontFamily: 'var(--fb)',
          fontSize: '15px',
          background: 'var(--sf)',
          color: 'var(--ink)',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
}: TextAreaProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontWeight: 600,
          marginBottom: '4px',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--rd)' }}> *</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid var(--line)',
          borderRadius: '4px',
          fontFamily: 'var(--fb)',
          fontSize: '15px',
          background: 'var(--sf)',
          color: 'var(--ink)',
          resize: 'vertical',
          minHeight: '80px',
        }}
      />
    </div>
  );
}

interface RadioGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

export function RadioGroup({ label, value, onChange, options, required }: RadioGroupProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend
          style={{
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--rd)' }}> *</span>}
        </legend>
        {options.map((option) => (
          <label
            key={option.value}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginBottom: '8px',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name={label}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              style={{
                width: '18px',
                height: '18px',
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
