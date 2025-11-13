import React, { useState } from 'react';
import PlayerEditor from './components/PlayerEditor';
import TeamEditor from './components/TeamEditor';

export default function App() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const addOrUpdatePlayer = (player) => {
    setPlayers(prev => {
      const idx = prev.findIndex(p => p.id === player.id);
      if (idx >= 0) {
        const newArr = [...prev];
        newArr[idx] = player;
        return newArr;
      } else {
        return [...prev, player];
      }
    });
  };

  const addOrUpdateTeam = (team) => {
    setTeams(prev => {
      const idx = prev.findIndex(t => t.id === team.id);
      if (idx >= 0) {
        const newArr = [...prev];
        newArr[idx] = team;
        return newArr;
      } else {
        return [...prev, team];
      }
    });
  };

  const uploadPhoto = (file) => {
    console.log('Uploading', file);
  };

  let playerEditor = null;

cat > src/App.jsx << 'EOF'
import React, { useState } from 'react';
import PlayerEditor from './components/PlayerEditor';
import TeamEditor from './components/TeamEditor';

export default function App() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const addOrUpdatePlayer = (player) => {
    setPlayers(prev => {
      const idx = prev.findIndex(p => p.id === player.id);
      if (idx >= 0) {
        const newArr = [...prev];
        newArr[idx] = player;
        return newArr;
      } else {
        return [...prev, player];
      }
    });
  };

  const addOrUpdateTeam = (team) => {
    setTeams(prev => {
      const idx = prev.findIndex(t => t.id === team.id);
      if (idx >= 0) {
        const newArr = [...prev];
        newArr[idx] = team;
        return newArr;
      } else {
        return [...prev, team];
      }
    });
  };

  const uploadPhoto = (file) => {
    console.log('Uploading', file);
  };

  let playerEditor = null;
  if (selectedPlayer) {
    const id = selectedPlayer.replace('__edit__','');
    const pl = players.find(x => x.id === id);
    if (pl) {
      playerEditor = (
        <PlayerEditor
          player={pl}
          teams={teams}
          onSave={addOrUpdatePlayer}
          onCancel={() => setSelectedPlayer(null)}
          uploadPhoto={uploadPhoto}
        />
      );
    } else if (selectedPlayer.endsWith('__edit__')) {
      playerEditor = (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Player not found</div>
      );
    }
  }

  let teamEditor = null;
  if (selectedTeam) {
    const id = selectedTeam.replace('__edit__','');
    const tm = teams.find(x => x.id === id);
    if (tm) {
      teamEditor = (
        <TeamEditor
          team={tm}
          onSave={addOrUpdateTeam}
          onCancel={() => setSelectedTeam(null)}
        />
      );
    } else if (selectedTeam.endsWith('__edit__')) {
      teamEditor = (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Team not found</div>
      );
    }
  }

  return (
    <div className="App p-4">
      {playerEditor}
      {teamEditor}
      {selectedTeam === '__new__' && (
        <TeamEditor
          onSave={addOrUpdateTeam}
          onCancel={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}
