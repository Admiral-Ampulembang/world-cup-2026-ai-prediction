import NavBar from './components/NavBar';
import Overview from './components/Overview';
import TodaysMatch from './components/TodaysMatch';
import TournamentChance from './components/TournamentChance';
import TournamentTracker from './components/TournamentTracker';

function App() {
  return (
    <div>
      <NavBar />
      <Overview />
      <TodaysMatch />
      <TournamentChance />
      <TournamentTracker />
    </div>
  )
}

export default App