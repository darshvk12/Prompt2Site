import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { assets } from '../assets/assets';
import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import {UserButton} from '@daveyplate/better-auth-ui'

const Navbar = ({ setLoading }: { setLoading?: Dispatch<SetStateAction<boolean>> }) =>{
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate= useNavigate()

  const {data : session} = authClient.useSession()
    return (
    <>
        <nav className="z-50 flex items-center justify-between w-full py-4 px-4 md:px-16 lg:px-24 xl:px-32 backdrop-blur border-b text-white border-slate-800">
        <Link to = '/'>
              <img src={assets.logo} alt="logo" className='h-5 sm:h-7' />
              </Link>         

          <div className="hidden md:flex items-center gap-8 transition duration-500">
            <Link to='/' onClick={() => setLoading?.(true)}>Home</Link>
            <Link to='/projects' onClick={() => setLoading?.(true)}>My Projects</Link>
            <Link to='/community' onClick={() => setLoading?.(true)}>Community</Link>
            <Link to='/pricing' onClick={() => setLoading?.(true)}>Pricing</Link>
          </div>

          {/* Mobile menu toggle */}
          <button onClick={()=> setMenuOpen(prev => !prev)} className="md:hidden p-2 mr-2 text-white" aria-label="Toggle menu">
            {!menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </button>

          <div className="flex items-center gap-3">
            { !session?.user ? (
            <button onClick={()=> { setLoading?.(true); navigate('./auth/signin') }} className="px-6 py-1.5 max-sm:text-sm bg-indigo-600 active:scale-95 hover:bg-indigo-700 transition rounded-md">
              Get started
            </button>
            ) : (
              <UserButton size='icon' />

            )
}
          </div>

          
        </nav>
         {/* Mobile Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 text-white backdrop-blur flex flex-col items-center justify-center text-lg gap-8 md:hidden transition-transform duration-300">
            <Link to ='/' onClick={()=> { setMenuOpen(false); setLoading?.(true); }}>Home</Link>
            <Link to ='/projects' onClick={()=> { setMenuOpen(false); setLoading?.(true); }}>My Projects</Link>
            <Link to ='/community' onClick={()=> { setMenuOpen(false); setLoading?.(true); }}>Community</Link>
            <Link to ='/pricing' onClick={()=> { setMenuOpen(false); setLoading?.(true); }}>Pricing</Link>
            <button className="active:ring-3 active:ring-white aspect-square size-10 p-1 items-center justify-center bg-slate-100 hover:bg-slate-200 transition text-black rounded-md flex" onClick={() => setMenuOpen(false)} >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}
        {/* BACKGROUND IMAGE */}
          <div aria-hidden className="absolute inset-0 -z-10 hero-bg" />

    </>
)

}

export default Navbar