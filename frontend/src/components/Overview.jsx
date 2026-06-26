import React, { useEffect, useState } from "react";
import advancement_probabilities from '../data/advancement_probabilities.json';
import {FLAG_CODES} from '../data/abbreviations';
import { fetchWithRetry } from '../utils/fetchWithRetry';

export default function Overview() {
    const countries = Object.entries(advancement_probabilities)
        .map(([country, stats]) => ({
            country,
            champion: stats.Champion
        }))
        .sort((a, b) => b.champion - a.champion)
        .map((item, index) => ({
            rank: index + 1,
            ...item
        }));

    const [teams, setTeams] = useState({})

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
        <section id="overview" className="flex flex-col px-5 py-10 gap-16 w-full lg:flex-row lg:px-20">
            <div className="w-full lg:flex-1 flex flex-col items-center gap-10 justify-center">
                {/* Hero - 60% */}
                <h1 className="text-5xl font-bold text-center">
                    World Cup 2026<br />AI Prediction
                </h1>
                <img 
                    alt="flag" 
                    src={`https://flagcdn.com/w320/${FLAG_CODES[countries[0]?.country] ?? "un"}.png`} 
                    className='w-36 lg:w-48 object-contain' 
                />
                <h2 className="text-3xl font-bold text-center">
                    {countries[0]?.country}
                </h2>
            </div>
            <div className="w-full lg:w-1/3">
                <div className="bg-primary text-light pl-3 pr-4 lg:pl-5 lg:pr-6 py-5 rounded-lg">
                    <h1 className='text-2xl font-semibold text-center pb-5'>
                        Pre-tournament Simulations
                    </h1>
                    <div className="h-87 md:h-[380px] lg:h-105 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent pr-3">
                        <table className="w-full text-sm md:text-base lg:text-lg">
                            <tbody>
                                {countries.map((item) => (
                                    <tr key={item.rank}>
                                        <td className="py-3 text-center w-12">{item.rank}</td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <img src={teams[item.country]} className='w-6 h-6 object-contain' />
                                                {item.country}
                                            </div>
                                        </td>
                                        <td className="py-3 text-right">{item.champion.toFixed(2) + "%"}</td>
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