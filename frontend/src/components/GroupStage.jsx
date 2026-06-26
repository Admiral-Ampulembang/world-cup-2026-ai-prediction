import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import TEAM_ABBREVIATIONS from '../data/abbreviations.js';
import { fetchWithRetry } from '../utils/fetchWithRetry';

export default function GroupStage({currentGroup, setCurrentGroup}) {
    const groupKeys = ["A","B","C","D","E","F","G","H","I","J","K","L"]
    const handlePrev = () => setCurrentGroup(prev => Math.max(0, prev - 1));
    const handleNext = () => setCurrentGroup(prev => Math.min(groupKeys.length - 1, prev + 1));
    const handleGroupClick = (index) => setCurrentGroup(index);

    const [standings, setStandings] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchStandings = async() => {
            try{
                setLoading(true)
                const response = await fetchWithRetry(`${import.meta.env.VITE_API_URL}/standings`)
                const data = await response.json()
                setStandings(data)
            } catch (err) {
                setError("Failed to load standings. Please try again later.")
            } finally {
                setLoading(false)
            }
        }
        fetchStandings()
    }, [])

    const currentTeams = standings[groupKeys[currentGroup]] ?? []

    return (
        <div className='w-full lg:flex-1 flex flex-col gap-4 justify-center'>
            <div className='w-full overflow-x-auto rounded-lg shadow-md bg-primary text-light'>
                <div className='mx-5 pb-5'>
                    <div className='pt-6 pb-4 text-6xl'>Group {groupKeys[currentGroup]}</div>
                    <hr className='border-white'></hr>
                    {error && <div className="text-red-400 py-4">{error}</div>}
                    {loading && <div className="text-light/60 py-4">Loading standings...</div>}
                    <div className='flex flex-col lg:flex-row pt-5 pb-0 gap-5'>
                        <div className='w-full lg:flex-1'>
                            <table className='w-full'>
                                <thead>
                                    <tr className='border-b border-white/75'>
                                        <th className='text-left w-full px-1 pb-2'>Team</th>
                                        <th className='text-center px-3 pb-2'>MP</th>
                                        <th className='hidden min-[500px]:table-cell text-center px-3 pb-2'>W</th>
                                        <th className='hidden min-[500px]:table-cell text-center px-3 pb-2'>D</th>
                                        <th className='hidden min-[500px]:table-cell text-center px-3 pb-2'>L</th>
                                        <th className='hidden min-[500px]:table-cell text-center px-3 pb-2'>GD</th>
                                        <th className='text-center pl-3 pr-2 pb-2'>Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTeams.map((team, index) => {
                                        const teamName = typeof team === "string" ? team : team.team
                                        const teamStats = standings[groupKeys[currentGroup]]?.find(s => s.team === teamName)
                                        return (
                                            <tr key={teamName} className='border-b border-white/75 last:border-b-0'>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className='min-w-6 px-3'>{index + 1}</span>
                                                        {teamStats?.logo && <img src={teamStats.logo} className='w-6 h-6 object-contain' />}
                                                        <span className="sm:hidden">{TEAM_ABBREVIATIONS[teamName] ?? teamName}</span>
                                                        <span className="hidden sm:inline">{teamName}</span>
                                                    </div>
                                                </td>
                                                <td className='text-center px-3 text-light/80'>{teamStats?.played ?? 0}</td>
                                                <td className='hidden min-[500px]:table-cell text-center text-light/80 px-3'>{teamStats?.win ?? 0}</td>
                                                <td className='hidden min-[500px]:table-cell text-center text-light/80 px-3'>{teamStats?.draw ?? 0}</td>
                                                <td className='hidden min-[500px]:table-cell text-center text-light/80 px-3'>{teamStats?.lose ?? 0}</td>
                                                <td className='hidden min-[500px]:table-cell text-center text-light/80 px-3'>{teamStats?.goalsDiff ?? 0}</td>
                                                <td className='text-center font-bold pl-3 pr-2'>{teamStats?.points ?? 0}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex items-center justify-center gap-2 pt-4 w-full select-none max-w-full overflow-hidden'>
                <button onClick={handlePrev} disabled={currentGroup === 0} className={`shrink-0 ${currentGroup === 0 ? 'opacity-30' : 'cursor-pointer'}`}>
                    <ArrowLeft className='text-primary' />
                </button>
                
                <div className='flex items-center gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2'>
                    {groupKeys.map((key, index) => (
                        <button 
                            key={key} 
                            onClick={() => handleGroupClick(index)}
                            className={`text-xl transition-all shrink-0 cursor-pointer ${
                                index === currentGroup
                                ? 'text-primary font-bold underline underline-offset-8 decoration-2'
                                : 'text-primary/40 hover:text-primary'
                            }`}
                        >
                            {key}
                        </button>
                    ))}
                </div>

                <button onClick={handleNext} disabled={currentGroup === groupKeys.length - 1} className={`shrink-0 ${currentGroup === groupKeys.length - 1 ? 'opacity-30' : 'cursor-pointer'}`}>
                    <ArrowRight className='text-primary' />
                </button>
            </div>
        </div>    
    );
}