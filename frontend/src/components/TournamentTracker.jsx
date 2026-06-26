import React from "react";
import KnockoutStage from "./KnockoutStage";
import GroupStage from "./GroupStage";
import { useState } from "react";

export default function TournamentTracker() {
    const [currentTab, setCurrentTab] = useState("group");
    const [currentGroup, setCurrentGroup] = useState(0);

    return (
        <section id="tournament_tracker" className='flex flex-col px-5 py-10 w-full lg:px-20'>
            <div>
                <h1 className='text-3xl font-semibold'>Tournament Tracker</h1>
                <div className='grid grid-cols-2 text-center border-b border-black dark:border-slate-700 w-full'>
                    <button 
                        onClick={() => setCurrentTab("group")}
                        className={`py-3 text-sm md:text-base font-semibold border-b-2 transition-all duration-200 focus:outline-none w-full cursor-pointer ${
                            currentTab === "group"
                                ? "border-primary text-primary" 
                                : "border-transparent text-dark hover:opacity-80 hover:border-slate-300"
                        }`}
                    >
                        Group Stage
                    </button>
                    <button 
                        onClick={() => setCurrentTab("knockout")}
                        className={`py-3 text-sm md:text-base font-semibold border-b-2 transition-all duration-200 focus:outline-none w-full cursor-pointer ${
                            currentTab === "knockout"
                                ? "border-primary text-primary" 
                                : "border-transparent text-dark hover:opacity-80 hover:border-slate-300"
                        }`}
                    >
                        Knockout Stage
                    </button>
                </div>
                <div className='py-5'>
                    {currentTab === "group" ? <GroupStage currentGroup={currentGroup} setCurrentGroup={setCurrentGroup} /> : <KnockoutStage />}
                </div>
            </div>
        </section>
    )
}