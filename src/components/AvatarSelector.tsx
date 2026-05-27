'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface AvatarSelectorProps {
  currentAvatar: string | null;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

export const AVATARS = [
  '/avatars/avatar_bear_1779881248970.png',
  '/avatars/avatar_compass_1779881307481.png',
  '/avatars/avatar_crystal_1779881266440.png',
  '/avatars/avatar_fox_1779881187836.png',
  '/avatars/avatar_lion_1779881294109.png',
  '/avatars/avatar_owl_1779881217261.png',
  '/avatars/avatar_rocket_1779881175311.png',
  '/avatars/avatar_shield_1779881200468.png',
  '/avatars/avatar_spaceship_1779881281092.png',
  '/avatars/avatar_star_1779881233324.png',
];

export function AvatarSelector({ currentAvatar, onSelect, onClose }: AvatarSelectorProps) {
  return (
    <div className="avatar-modal-overlay" onClick={onClose}>
      <motion.div 
        className="glass avatar-modal-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, textAlign: 'center', marginBottom: '20px', color: 'white' }}>
          Elige tu Insignia
        </h3>
        
        <div className="avatar-grid">
          {AVATARS.map((avatar) => (
            <button 
              key={avatar}
              className={`avatar-btn ${currentAvatar === avatar ? 'selected' : ''}`}
              onClick={() => {
                onSelect(avatar);
                onClose();
              }}
            >
              <Image 
                src={avatar} 
                alt="Avatar option" 
                width={80} 
                height={80} 
                priority={true}
                className="avatar-image"
              />
            </button>
          ))}
        </div>
        
        <button onClick={onClose} className="btn-primary" style={{ marginTop: '25px', width: '100%', background: 'rgba(255,255,255,0.1)' }}>
          Cancelar
        </button>
      </motion.div>

      <style jsx>{`
        .avatar-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
        }
        .avatar-modal-content {
          padding: 20px;
          border-radius: 24px;
          max-width: 450px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 12px;
          justify-items: center;
        }
        .avatar-btn {
          background: rgba(255,255,255,0.05);
          border: 2px solid transparent;
          border-radius: 16px;
          padding: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          aspect-ratio: 1;
        }
        .avatar-btn:hover {
          transform: scale(1.05);
          background: rgba(255,255,255,0.1);
        }
        .avatar-btn.selected {
          border-color: #06b6d4;
          background: rgba(6, 182, 212, 0.2);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
        }
        .avatar-image {
          border-radius: 12px;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      `}</style>
    </div>
  );
}
