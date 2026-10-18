// ClientComponent.js
'use client';

import { useState, useEffect } from 'react';

export default function ClientComponent({ setTextSize }) {
  useEffect(() => {
    const storedFontSize = localStorage.getItem('fontSize') || 42;
    setTextSize(storedFontSize);
  }, [setTextSize]);

  return <div>Client Component</div>;
}
