'use client';

import { useState } from 'react';
import { GlassModal } from '@/components/ui/GlassModal';
import { UniversalInbox } from './UniversalInbox';
import { color, shadow, animation, radius, zIndex } from '@/styles/tokens';

export function FloatingDropButton(): React.ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed"
        style={{
          top: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          background: `linear-gradient(135deg, ${color.ember.DEFAULT}, ${color.ember.flame})`,
          border: 'none',
          borderRadius: radius.full,
          color: color.text.inverse,
          fontSize: '1.25rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: zIndex.sticky,
          boxShadow: isHovered ? shadow.emberGlowLg : shadow.emberGlow,
          transform: isHovered ? animation.hover.grow : 'none',
          transition: `all ${animation.duration.normal} ${animation.easing.default}`,
        }}
        title="Universal Inbox (Drop anything)"
      >
        ➕
      </button>

      {/* Modal */}
      <GlassModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Universal Inbox"
        width="lg"
      >
        <UniversalInbox />
      </GlassModal>
    </>
  );
}