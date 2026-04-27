import React, { useState, useEffect, useRef } from 'react';

let ReactQuill = null; // will be loaded lazily

export default function RichTextEditor({ value, onChange, placeholder, modules, formats }) {
  const [loaded, setLoaded] = useState(false);
  const quillRef = useRef(null);

  useEffect(() => {
    // Dynamically import react-quill only on client side
    import('react-quill')
      .then((mod) => {
        ReactQuill = mod.default;
        // also import CSS if not already imported elsewhere
        import('react-quill/dist/quill.snow.css');
        setLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load ReactQuill:', err);
      });
  }, []);

  if (!loaded) {
    // fallback simple textarea while editor loads
    return (
      <textarea
        className="form-control"
        rows={12}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: '400px', resize: 'vertical' }}
      />
    );
  }

  const QuillComponent = ReactQuill;
  return (
    <QuillComponent
      ref={quillRef}
      theme="snow"
      value={value || ''}
      onChange={onChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      style={{ minHeight: '400px' }}
    />
  );
}
