import React from "react";
import { useState } from "react";
import { MatchCard } from "./KnockoutStage";

const roundSpacing = [
    { mb: "mb-[1rem]", mt: "mt-0" },
    { mb: "mb-[6.5rem]", mt: "mt-[2.75rem]" },
    { mb: "mb-[17.5rem]", mt: "mt-[8.25rem]" },
    { mb: "mb-[39.5rem]", mt: "mt-[19.25rem]" },
    { mb: "mb-4", mt: "mt-[41.25rem]" }
];

const slotHeights = [5.5, 11, 22, 44];

export default function KnockoutStageMobile({rounds}) {
    const thirdPlaceMatch = rounds.find(r => r.id === "thirdPlace")?.matches[0];
    const columns = rounds.filter(r => r.id !== "thirdPlace").map(r => {
        return r.id === "final" ? { ...r, thirdPlaceMatch: thirdPlaceMatch } : { ...r };
    });

    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="overflow-x-hidden w-full">
            <div className="flex flex-row border-b border-slate-200 dark:border-slate-700 w-full gap-2">
                {columns.map((column, index) => (
                    <button 
                        key={column.id} 
                        onClick={() => setActiveIndex(index)} 
                        className={`py-3 px-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 focus:outline-none flex-1 text-center ${
                            index === activeIndex 
                                ? "border-primary text-primary" 
                                : "border-transparent text-dark hover:opacity-80"
                        }`}
                    >
                        {column.label}
                    </button>
                ))}            
            </div>
            <div 
                className="flex flex-row mt-12" 
                style={{
                    transform: `translateX(-${activeIndex * 160}px)`, 
                    transition: "transform 0.3s ease"
                }}
            >
                {columns.map((column, columnIndex) => (
                    <div key={column.id} className="min-w-[160px] max-w-[160px] flex flex-col shrink-0">
                        {column.matches.map((match, matchIndex) => (
                            <div key={match.id} className={`relative ${column.id === "final" ? "" : roundSpacing[columnIndex - activeIndex]?.mb} ${matchIndex === 0 ? roundSpacing[columnIndex - activeIndex]?.mt : ""}`}>
                                {column.id === "final" && (
                                    <h2 className="absolute -top-6 -left-4 text-xs font-bold uppercase tracking-wider text-dark w-full text-center">
                                        Final
                                    </h2>
                                )}
                                <MatchCard match={match}/>
                                {column.id !== "final" && columnIndex >= activeIndex && matchIndex % 2 === 0 && (
                                    <>
                                        <div className="absolute right-8 translate-x-full top-[2.25rem] w-4 border-b-2 border-gray-400"></div>
                                        <div className="absolute right-9 translate-x-[1.25rem] top-[2.25rem] border-l-2 border-gray-400" style={{height: `${slotHeights[columnIndex - activeIndex]}rem`}}></div>
                                        <div className="absolute right-10 translate-x-[2.5rem] border-b-2 border-gray-400 w-4" style={{top: `${2.25 + slotHeights[columnIndex - activeIndex] / 2}rem`}}></div>
                                    </>
                                )}
                                {column.id !== "final" && columnIndex >= activeIndex && matchIndex % 2 === 1 && (
                                    <div className="absolute right-8 translate-x-full top-[2.25rem] w-4 border-t-2 border-gray-400"></div>
                                )}
                            </div>
                        ))}
                        {column.thirdPlaceMatch && (
                            <div className="relative mt-10">
                                <MatchCard key="thirdPlace" match={column.thirdPlaceMatch} />
                                <h2 className="text-xs font-bold uppercase tracking-wider text-dark mt-2 pl-6">
                                    Third Place
                                </h2>
                            </div>
                        )}
                    </div>
                ))} 
            </div>
        </div>
    );
}