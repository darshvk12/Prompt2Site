

import { useLocation } from 'react-router-dom';

const Footer = ()=> {
  const { pathname } = useLocation();

  // Hide footer on the home page
  if (pathname === '/' || pathname === '/home') return null;

  return (
    <footer className='mt-24 bg-transparent'>
      <div className='max-w-6xl mx-auto px-4 py-8 text-center'>
        <p className='text-gray-400 text-sm'>Copyright © 2025 SiteBuilder</p>
      </div>
    </footer>
  )
}

export default Footer 