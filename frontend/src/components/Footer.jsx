import React from 'react';
import { FaLinkedin, FaGithub, FaGlobe } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className='bg-primary text-light py-10 mt-auto'>
            <div className='flex flex-col items-center gap-4'>
                <div className='flex gap-8'>
                    <a href='https://www.linkedin.com/in/admiral-denaldy-ampulembang/' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 text-sm hover:opacity-70 transition-opacity'><FaLinkedin size={16} />LinkedIn</a>
                    <a href='https://github.com/Admiral-Ampulembang' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 text-sm hover:opacity-70 transition-opacity'><FaGithub size={16} />GitHub</a>
                    <a href='https://admiral-ampulembang.vercel.app/' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 text-sm hover:opacity-70 transition-opacity'><FaGlobe size={16} />Portfolio</a>
                </div>
                <p className='text-xs text-light/50'>© {new Date().getFullYear()} Admiral Denaldy Ampulembang</p>
            </div>
        </footer>
    );
}