import React from "react";
import advancement_probabilities from '../data/advancement_probabilities.json';
import { useState, useEffect } from 'react';
import TEAM_ABBREVIATIONS from '../data/abbreviations.js';
import { fetchWithRetry } from '../utils/fetchWithRetry';

export default function TournamentChance() {
    const [sortKey, setSortKey] = useState("Champion");
    const [sortDirection, setSortDirection] = useState("desc");
    const [teams, setTeams] = useState({})
    
    const handleSort = (key) => {
        if (key === sortKey) {
            setSortDirection(prev => prev === "desc" ? "asc" : "desc");
        } else {
            setSortKey(key);
            setSortDirection(key === "Team" ? "asc" : "desc");
        }
    };

    const sortedTeams = Object.keys(advancement_probabilities).sort((a, b) => {
        let diff;

        if (sortKey === "Team") {
            diff = a.localeCompare(b);
        }

        else {
            diff = advancement_probabilities[b][sortKey] - advancement_probabilities[a][sortKey];
        }

        return sortDirection === "desc" ? diff : -diff;
    });

    useEffect(() => {
        const fetchTeams = async() => {
            try {
                const response = await fetchWithRetry(`${import.meta.env.VITE_API_URL}/teams`)
                const data = await response.json()
                setTeams(data)
            } catch (err) {
                console.error(err)
            }
        }
        fetchTeams()
    }, [])

    return (
        <section id="tournament_chance" className='flex flex-col px-5 py-10 w-full lg:px-20'>
            <div>
                <h1 className='text-3xl font-semibold'>Tournament Chance</h1>
                <div className='bg-primary text-light mt-4 px-5 py-5 rounded-lg'>
                    <div className='h-108 md:h-106 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent pr-3'>
                        <table className="min-w-full border-separate border-spacing-0">
                            <thead>
                                <tr className='sticky top-0 bg-primary z-20'>
                                    <th className='text-left px-1 pb-2 sticky top-0 left-0 bg-primary z-30 min-w-[100px] sm:min-w-[140px] border-b border-white/75'>
                                        <button onClick={() => handleSort("Team")} className="cursor-pointer">
                                            Team
                                        </button>
                                    </th>
                                    <th className='text-center px-3 pb-2 border-b border-white/75'>
                                        <button onClick={() => handleSort("R32")} className="cursor-pointer">
                                            R32
                                        </button>    
                                    </th>
                                    <th className='text-center px-3 pb-2 border-b border-white/75'>
                                        <button onClick={() => handleSort("R16")} className="cursor-pointer">
                                            R16
                                        </button>    
                                    </th>
                                    <th className='text-center px-3 pb-2 border-b border-white/75'>
                                        <button onClick={() => handleSort("QF")} className="cursor-pointer">
                                            QF
                                        </button>    
                                    </th>
                                    <th className='text-center px-3 pb-2 border-b border-white/75'>
                                        <button onClick={() => handleSort("SF")} className="cursor-pointer">
                                            SF
                                        </button>    
                                    </th>
                                    <th className='text-center px-3 pb-2 border-b border-white/75'>
                                        <button onClick={() => handleSort("Final")} className="cursor-pointer">
                                            Final
                                        </button>    
                                    </th>
                                    <th className='text-center px-3 pb-2 border-b border-white/75'>
                                        <button onClick={() => handleSort("Champion")} className="cursor-pointer">
                                            Champion
                                        </button>    
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTeams.map((team) => (
                                    <tr key={team} className="last:[&>td]:border-b-0">
                                        <td className="py-3 sticky left-0 bg-primary z-10 pr-6 border-b border-white/75">
                                            <div className="flex items-center gap-2">
                                                <img src={teams[team]} className='w-6 h-6 object-contain' />
                                                <span className="sm:hidden">{TEAM_ABBREVIATIONS[team] ?? team}</span>
                                                <span className="hidden sm:inline">{team}</span>
                                            </div>
                                        </td>
                                        <td className='text-center text-light/80 px-3 border-b border-white/75'>{advancement_probabilities[team]["R32"].toFixed(2)}%</td>
                                        <td className='text-center text-light/80 px-3 border-b border-white/75'>{advancement_probabilities[team]["R16"].toFixed(2)}%</td>
                                        <td className='text-center text-light/80 px-3 border-b border-white/75'>{advancement_probabilities[team]["QF"].toFixed(2)}%</td>
                                        <td className='text-center text-light/80 px-3 border-b border-white/75'>{advancement_probabilities[team]["SF"].toFixed(2)}%</td>
                                        <td className='text-center text-light/80 px-3 border-b border-white/75'>{advancement_probabilities[team]["Final"].toFixed(2)}%</td>
                                        <td className='text-center font-bold px-3 border-b border-white/75'>{advancement_probabilities[team]["Champion"].toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    )
}