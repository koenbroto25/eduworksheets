import React, { useState, useEffect, useRef } from 'react';
import { Facebook, Twitter, MessageSquare, Link, Check } from 'lucide-react';

interface ShareMenuProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ url, title, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareOptions = [
    {
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5 text-blue-600" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Twitter',
      icon: <Twitter className="h-5 w-5 text-sky-500" />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'WhatsApp',
      icon: <MessageSquare className="h-5 w-5 text-green-500" />,
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      onClose();
    }, 1500);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
    >
      <div className="py-1">
        {shareOptions.map((option) => (
          <a
            key={option.name}
            href={option.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            {option.icon}
            <span className="ml-3">{option.name}</span>
          </a>
        ))}
        <button
          onClick={handleCopyLink}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          {isCopied ? (
            <>
              <Check className="h-5 w-5 text-green-600" />
              <span className="ml-3">Tersalin!</span>
            </>
          ) : (
            <>
              <Link className="h-5 w-5 text-gray-500" />
              <span className="ml-3">Salin Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
