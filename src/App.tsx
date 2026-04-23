import React, { useState, useEffect } from 'react';
import Editor from './Editor';
import Generator from './Generator';

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/editor');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Simple Hash Router
  if (currentHash === '#/public') {
    return <Generator />;
  }

  // Default route is Editor
  return <Editor />;
}
