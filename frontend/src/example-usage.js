const { gameDB } = require('./db/instantDb');

// Example usage
async function example() {
  // Create a new room
  const room = await gameDB.createRoom('room123', 'player1');
  
  // Join a room
  await gameDB.joinRoom('room123', 'player2');
  
  // Log some game data
  await gameDB.logGameData('room123', {
    score: 100,
    moves: ['move1', 'move2']
  });
  
  // Subscribe to room updates
  gameDB.subscribeToRoom('room123', (roomData) => {
    console.log('Room updated:', roomData);
  });
} 