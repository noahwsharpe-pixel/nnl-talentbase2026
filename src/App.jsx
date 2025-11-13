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
    let pl = players.find(x => x.id === selectedPlayer.replace('__edit__',''));
    playerEditor = pl ? (
      <PlayerEditor
        player={pl}
        teams={teams}
        onSave={addOrUpdatePlayer}
        onCancel={() => setSelectedPlayer(null)}
        uploadPhoto={uploadPhoto}
      />
    ) : selectedPlayer.endsWith('__edit__') ? (
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Player not found</div>
    ) : null;
  }

  let teamEditor = null;
  if (selectedTeam) {
    let tm = teams.find(x => x.id === selectedTeam.replace('__edit__',''));
    teamEditor = tm ? (
      <TeamEditor
        team={tm}
        onSave={addOrUpdateTeam}
        onCancel={() => setSelectedTeam(null)}
      />
    ) : selectedTeam.endsWith('__edit__') ? (
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Team not found</div>
    ) : null;
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
