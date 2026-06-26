import React from 'react';
import Calendar from 'react-calendar';
import { useState } from 'react';
import { useEffect } from 'react';
import TEAM_ABBREVIATIONS, { FLAG_CODES } from '../data/abbreviations.js';
import { fetchWithRetry } from '../utils/fetchWithRetry';

export default function TodaysMatch() {
    const custom_minDate = new Date(2026, 5, 11);
    const custom_maxDate = new Date(2026, 6, 20);

    const [matches, setMatches] = useState([])
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchMatches = async() => {
            try {
                setLoading(true)
                setError(null)
                const formatted = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
                const response = await fetchWithRetry(`${import.meta.env.VITE_API_URL}/fixtures?date=${formatted}&timezone=${timezone}`)
                const data = await response.json() 
                setMatches(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchMatches()
    }, [selectedDate])

    const handleDateChange = (date) => {
        setSelectedDate(date)
    }

    return (
        <section id='todays_match' className='flex flex-col px-5 py-10 gap-2 lg:gap-10 w-full lg:flex-row lg:px-20'>
            <div className='w-full lg:flex-1 flex flex-col gap-4'>
                <h1 className='text-3xl font-semibold'>Today's Match</h1>
                <div className='items-center'>
                    {loading && <div>Loading ...</div>}
                    {error && <div className="text-red-400 py-4">Failed to load matches. Please try again later.</div>}
                    {!loading && !error && matches.length === 0 && <div>No matches scheduled for this date.</div>}
                    {!loading && matches.map((match) => (                    
                        <div key={match.id} className={`bg-primary text-light mb-6 rounded-lg ${match.status === "FT" ? "py-6" : "py-10"}`}>
                            <div className='w-full px-4 lg:px-10'>
                                <div className='flex justify-center items-center gap-2 sm:gap-4 lg:gap-10 pb-5 w-full'>
                                    <div className='flex flex-1 items-center justify-end gap-2 sm:gap-3 font-bold text-right min-w-0'>
                                        <span className='truncate sm:whitespace-normal'>
                                            <span className="sm:hidden">{TEAM_ABBREVIATIONS[match.home_team] ?? match.home_team}</span>
                                            <span className="hidden sm:inline">{match.home_team}</span>
                                        </span>
                                        <img 
                                            src={`https://flagcdn.com/w160/${FLAG_CODES[match.home_team] ?? "un"}.png`} 
                                            className='w-9 h-6 sm:w-12 sm:h-8 object-cover rounded-sm shadow-sm flex-shrink-0' 
                                            alt="Home Flag"
                                        />
                                    </div>
                                    
                                    <div className='px-2 font-semibold flex-shrink-0 text-sm sm:text-base'>vs</div>
                                    
                                    <div className='flex flex-1 items-center justify-start gap-2 sm:gap-3 font-bold text-left min-w-0'>
                                        <img 
                                            src={`https://flagcdn.com/w160/${FLAG_CODES[match.away_team] ?? "un"}.png`} 
                                            className='w-9 h-6 sm:w-12 sm:h-8 object-cover rounded-sm shadow-sm flex-shrink-0' 
                                            alt="Away Flag"
                                        />
                                        <span className='truncate sm:whitespace-normal'>
                                            <span className="sm:hidden">{TEAM_ABBREVIATIONS[match.away_team] ?? match.away_team}</span>
                                            <span className="hidden sm:inline">{match.away_team}</span>
                                        </span>
                                    </div>
                                </div>
                                
                                <hr className='border-white/50'></hr>
                                {match.status === "FT" ? (
                                    <div className='flex justify-center gap-10 pt-3 text-2xl font-bold'>
                                        <span>{match.score.home}</span>
                                        <span>-</span>
                                        <span>{match.score.away}</span>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between py-5">
                                            <div className='text-left'>
                                                <div>Home</div>
                                                <div>{(match.prediction.home_win * 100).toFixed(1)}%</div>
                                            </div>

                                            <div className='text-center'>
                                                <div>Draw</div>
                                                <div>{(match.prediction.draw * 100).toFixed(1)}%</div>
                                            </div>

                                            <div className='text-right'>
                                                <div>Away</div>
                                                <div>{(match.prediction.away_win * 100).toFixed(1)}%</div>
                                            </div>
                                        </div>
                                        <div className='flex w-full overflow-hidden rounded-full h-[10px]'>
                                            <div style={{width: `${(match.prediction.home_win * 100).toFixed(1)}%`}} className='bg-green-400 h-full'></div>
                                            <div style={{width: `${(match.prediction.draw * 100).toFixed(1)}%`}} className='bg-orange-400 h-full'></div>
                                            <div style={{width: `${(match.prediction.away_win * 100).toFixed(1)}%`}} className='bg-red-400 h-full'></div>
                                        </div>
                                    </div>
                                )}                              
                            </div>
                        </div>                    
                    ))}
                </div>
            </div>
            <div className='w-full lg:w-1/3 lg:mt-[3.25rem]'>
                <div className='bg-primary text-light px-5 py-5 rounded-lg'>
                    <Calendar
                        value={selectedDate} 
                        minDate={custom_minDate}
                        maxDate={custom_maxDate}
                        showNeighboringMonth={false}
                        showFixedNumberOfWeeks={false}
                        onViewChange={({ view }) => view !== 'month'}
                        className="my-custom-calendar"
                        onChange={handleDateChange} 

                        // remove the << and >> arrows:
                        prev2Label={null}
                        next2Label={null}
                    />
                </div>
            </div>
        </section>
    )
}