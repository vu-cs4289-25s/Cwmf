const { createClient } = require('@instantdb/core');

class GameDatabase {
  constructor() {
    this.db = createClient({
      apiKey: "98c74b4a-d255-4e76-a706-87743b5d7c07"
    });
  }

  // Create a new game room
  async createRoom(roomId, hostId) {
    try {
      const room = await this.db.rooms.create({
        id: roomId,
        hostId,
        players: [hostId],
        createdAt: Date.now(),
        status: 'waiting' // waiting, active, finished
      });
      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  // Join an existing room
  async joinRoom(roomId, playerId) {
    try {
      const room = await this.db.rooms.update(roomId, {
        players: this.db.array.push(playerId)
      });
      return room;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  // Log game data
  async logGameData(roomId, gameData) {
    try {
      await this.db.gameLogs.create({
        roomId,
        timestamp: Date.now(),
        data: gameData
      });
    } catch (error) {
      console.error('Error logging game data:', error);
      throw error;
    }
  }

  // Get room data
  async getRoomData(roomId) {
    try {
      const room = await this.db.rooms.get(roomId);
      return room;
    } catch (error) {
      console.error('Error getting room data:', error);
      throw error;
    }
  }

  // Subscribe to room updates
  subscribeToRoom(roomId, callback) {
    try {
      return this.db.rooms
        .filter({ id: roomId })
        .subscribe(callback);
    } catch (error) {
      console.error('Error subscribing to room:', error);
      throw error;
    }
  }
}

const gameDB = new GameDatabase();
module.exports = { gameDB }; 