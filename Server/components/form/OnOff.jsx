import React, { useState } from 'react';

export default function OnOff({ enabled, setState }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label="الدفع بالتقسيط"
      aria-checked={enabled}
      onClick={() => setState(!enabled)}
      className="payment-mode-switch"
    >
        <span
          aria-hidden="true"
          style={{ right: enabled ? '65px' : '4px' }}
          className="payment-mode-knob"
        />
    </button>
  );
}
