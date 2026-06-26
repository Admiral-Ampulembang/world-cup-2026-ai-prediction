import React from 'react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function NavBar() {
    const [isOpen,  set_isOpen] = useState(false);
    
    return (
        <nav className='py-6 bg-primary sticky top-0 z-50'>
            <div className='flex justify-end px-6'>
                <button className='lg:hidden' onClick={() => set_isOpen(!isOpen)}>
                    {isOpen ? <X className='text-light'/> : <Menu className='text-light'/>}
                </button>
            </div>

            <div className='flex justify-center'>
                <ul className={`flex flex-col lg:flex-row w-full lg:w-2/3 justify-center lg:justify-between text-light text-center ${isOpen ? 'block' : 'hidden'} lg:flex`}>
                    <li className='py-2'><a href='#overview' className='hover:opacity-70 transition-opacity py-2'>Overview</a></li>
                    <li className='py-2'><a href='#todays_match' className='hover:opacity-70 transition-opacity py-2'>Today's Match</a></li>
                    <li className='py-2'><a href='#tournament_chance' className='hover:opacity-70 transition-opacity py-2'>Tournament Chance</a></li>
                    <li className='py-2'><a href='#tournament_tracker' className='hover:opacity-70 transition-opacity py-2'>Tournament Tracker</a></li>
                </ul>
            </div>
        </nav>
    );
}