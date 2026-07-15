import React, { useEffect, useState } from "react";
import KnockoutStageMobile from "./KnockoutStageMobile";
import TEAM_ABBREVIATIONS from '../data/abbreviations.js';
import { fetchWithRetry } from '../utils/fetchWithRetry';

export function MatchCard({ match, side }) {
    const isRightSide = side === "right";

    const renderScore = (teamSide) => {
        const isFinished = ["FT", "AET", "PEN", "AWD"].includes(match.status);
        if (!isFinished) return null;

        const mainScore = teamSide === "home" ? match.score.home : match.score.away;
        const penaltyScore = teamSide === "home" ? match.score.penalty?.home : match.score.penalty?.away;

        const penaltyEl = (penaltyScore !== null && penaltyScore !== undefined) && (
            <span className="text-[10px] font-normal">
                ({penaltyScore})
            </span>
        );
        const mainEl = <span>{mainScore}</span>;

        return (
            <span className="font-bold px-1 text-xs whitespace-nowrap flex items-center gap-1.5">
                {isRightSide ? (
                    <>
                        {mainEl}
                        {penaltyEl}
                    </>
                ) : (
                    <>
                        {penaltyEl}
                        {mainEl}
                    </>
                )}
            </span>
        );
    }

    const renderTeamRow = (teamName, teamLogo, scoreKey) => {
        return (
            <div className={`flex justify-between items-center gap-1 w-full min-w-0 px-1 ${isRightSide ? "flex-row-reverse text-right" : "text-left"}`}>
                <div className={`flex items-center gap-1.5 truncate w-16 min-w-0 ${isRightSide ? "flex-row-reverse" : ""}`}>
                    {teamLogo && <img src={teamLogo} className="w-4 h-4 object-contain flex-shrink-0" alt="" />}
                    <span className="truncate text-xs block w-full">
                        {TEAM_ABBREVIATIONS[teamName] ?? teamName}
                    </span>
                </div>
                {renderScore(scoreKey)}
            </div>
        )
    }

    return (
        <div className={`border-4 rounded p-1.5 w-32 bg-primary text-light h-18 text-sm border-gray-200 flex flex-col justify-center gap-1 ${match.home_team === "TBD" ? "opacity-80" : ""}`}>
            {renderTeamRow(match.home_team, match.home_logo, "home")}
            {renderTeamRow(match.away_team, match.away_logo, "away")}
        </div>
    )
}

const roundSpacing = {
    r32: { mb: "mb-[1rem]", mt: "mt-0" },
    r16: { mb: "mb-[6.5rem]", mt: "mt-[2.75rem]" },
    qf:  { mb: "mb-[17.5rem]", mt: "mt-[8.25rem]" },
    sf:  { mb: "mb-[39.5rem]", mt: "mt-[19.25rem]" },
}

const slotHeights = {
    r32: 5.5,
    r16: 11,
    qf: 22
}

function BracketColumn({side, rounds}) {
    const edgeClass = side === "left" ? "right-0" : "left-0"
    const translate1 = side === "left" ? "translate-x-full" : "-translate-x-full"
    const translate2 = side === "left" ? "translate-x-[1.25rem]" : "-translate-x-[1.25rem]"
    const translate3 = side === "left" ? "translate-x-[2.5rem]" : "-translate-x-[2.5rem]"
    const borderClass = side === "left" ? "border-l-2" : "border-r-2"

    const textAlignment = side === "left" ? "text-left items-start" : "text-right items-end";

    return (
        <div className="flex flex-row gap-10">
            {rounds.map(round => (
                <div key={round.id} className={`flex flex-col ${textAlignment}`}>
                    <h2 className={`text-xs font-bold uppercase tracking-wider mb-2 w-full px-1`}>
                        {round.label}
                    </h2>
                    <div className="relative">
                        {round.matches.map((item, index) => {
                            const slotHeight = slotHeights[round.id]
                            const midpoint = 2.25 + slotHeight / 2

                            return (                                        
                                <div key={item.id} className={`relative ${roundSpacing[round.id].mb} last:mb-0 ${index === 0 ? roundSpacing[round.id].mt : ""}`}>
                                    <MatchCard match={item} side={side} />
                                    {slotHeight && index % 2 === 0 && (
                                        <>
                                            <div className={`absolute ${edgeClass} ${translate1} top-[2.25rem] w-5 border-b-2 border-gray-400`}></div>
                                            <div className={`absolute ${edgeClass} ${translate2} top-[2.25rem] w-0 ${borderClass} border-gray-400`} style={{height: `${slotHeight}rem`}}></div>
                                            <div className={`absolute ${edgeClass} ${translate3} w-5 border-b-2 border-gray-400`} style={{top: `${midpoint}rem`}}></div>
                                        </>
                                    )}
                                    {slotHeight && index % 2 === 1 && (
                                        <div className={`absolute ${edgeClass} ${translate1} top-[2.25rem] w-5 border-t-2 border-gray-400`}></div>
                                    )}
                                </div>                                       
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}

const bracketTemplate = {
    "r32": { label: "Round of 32", count: 16 },
    "r16": { label: "Round of 16", count: 8 },
    "qf": { label: "Quarter-finals", count: 4 },
    "sf": { label: "Semi-finals", count: 2 },
    "final": { label: "Final", count: 1 },
    "thirdPlace": { label: "Third Place", count: 1 },
}

export default function KnockoutStage() {
    const [fixtures, setFixtures] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMatches = async() => {
            try {
                setLoading(true)
                const response = await fetchWithRetry(`${import.meta.env.VITE_API_URL}/fixtures/knockout`)
                const data = await response.json()
                setFixtures(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchMatches()
    }, [])
    
    const roundMap = {
        "Round of 32": { id: "r32", label: "Round of 32" },
        "Round of 16": { id: "r16", label: "Round of 16" },
        "Quarter-finals": { id: "qf", label: "Quarter-finals" },
        "Semi-finals": { id: "sf", label: "Semi-finals" },
        "3rd Place Final": { id: "thirdPlace", label: "Third Place" },
        "Final": { id: "final", label: "Final" },
    }

    const grouped = fixtures.reduce((acc, match) => {
        if (!acc[match.round]) acc[match.round] = []
        acc[match.round].push(match)
        return acc
    }, {})

    const rounds = Object.keys(grouped).map(roundName => ({
        ...roundMap[roundName],
        matches: grouped[roundName]
    }))

    const filledRounds = Object.entries(bracketTemplate).map(([id, { label, count }]) => {
        const realRound = rounds.find(r => r.id === id)
        
        const matches = Array.from({ length: count }, (_, i) => {
            if (realRound && realRound.matches[i]) {
                return realRound.matches[i]
            }
            return {
                id: `tbd-${id}-${i}`,
                status: "NS",
                home_team: "TBD",
                home_logo: null,
                away_team: "TBD",
                away_logo: null,
                score: { home: null, away: null, penalty: { home: null, away: null } },
                prediction: null
            }
        })

        return { id, label, matches }
    })

    const mainRounds = filledRounds.filter(r => r.id !== "thirdPlace" && r.id !== "final")
    const leftRounds = mainRounds.map(r => ({ ...r, matches: r.matches.slice(0, Math.floor(r.matches.length / 2))}))
    const rightRounds = [...mainRounds].map(r => ({ ...r, matches: r.matches.slice(Math.floor(r.matches.length / 2))})).reverse()    
    const thirdPlaceMatch = filledRounds.find(r => r.id === "thirdPlace")?.matches[0]
    const finalMatch = filledRounds.find(r => r.id === "final")?.matches[0]

    if (loading) return <div>Loading ...</div>
    
    return (
        <div>
            <div className="xl:hidden">
                <KnockoutStageMobile rounds={filledRounds}/>
            </div>
            <div className="overflow-x-auto w-full hidden xl:block">          
            <div className="inline-flex flex-row justify-center gap-10 relative min-w-full">
                <BracketColumn side="left" rounds={leftRounds} />
                
                <div className="relative">
                    <div className="flex flex-col absolute left-1/2 -translate-x-1/2 top-[10.0rem] gap-[14rem]">
                        <div className="relative flex flex-col items-center">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-dark mb-2">
                                Final
                            </h2>
                            {finalMatch && <MatchCard match={finalMatch} side="left" />}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-[2.375rem] border-l-2 border-gray-400"></div>
                            <div className="absolute left-[-2.5rem] right-[-2.5rem] top-[calc(100%+2.375rem)] border-t-2 border-gray-400"></div>
                            <div className="absolute left-[-2.5rem] top-[calc(100%+2.375rem)] w-0 h-[2.375rem] border-l-2 border-gray-400"></div>
                            <div className="absolute right-[-2.5rem] top-[calc(100%+2.375rem)] w-0 h-[2.375rem] border-l-2 border-gray-400"></div>
                        </div>
                        <div className="relative flex flex-col items-center">
                            {thirdPlaceMatch && <MatchCard match={thirdPlaceMatch} side="left" />}
                            <h2 className="text-xs font-bold uppercase tracking-wider text-dark mt-2">
                                Third Place
                            </h2>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-[2.375rem] border-l-2 border-gray-400"></div>
                            <div className="absolute left-[-2.5rem] right-[-2.5rem] bottom-[calc(100%+2.375rem)] border-t-2 border-gray-400"></div>
                            <div className="absolute left-[-2.5rem] bottom-[calc(100%+2.375rem)] w-0 h-[2.375rem] border-l-2 border-gray-400"></div>
                            <div className="absolute right-[-2.5rem] bottom-[calc(100%+2.375rem)] w-0 h-[2.375rem] border-l-2 border-gray-400"></div>
                        </div>                          
                    </div>
                </div>
                <BracketColumn side="right" rounds={rightRounds} />
            </div>
            </div>
        </div>
    )
}