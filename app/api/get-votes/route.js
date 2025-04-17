// Update your get-votes route.js to include the totalPlayers count
import { init } from "@instantdb/admin";
import { NextResponse } from 'next/server';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const db = init({
    appId: APP_ID,
    adminToken: process.env.NEXT_PUBLIC_INSTANT_APP_ADMIN_TOKEN,
});

export async function GET(request) {
    try {
        // GET requests shouldn't have bodies, use URL parameters instead
        const { searchParams } = new URL(request.url);
        const gameCode = searchParams.get('gameCode');
        const roundId = searchParams.get('roundId'); // Get optional roundId parameter

        // Validate required fields
        if (!gameCode) {
            return NextResponse.json(
                { error: 'Game code is required' },
                { status: 400 }
            );
        }

        // First, get the game ID from the game code
        const gameIdQuery = {
            games: {
                $: {
                    where: { gameCode: gameCode },
                },
            },
        };

        const gameIdData = await db.query(gameIdQuery);

        if (!gameIdData?.games?.[0]) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }

        const game = gameIdData.games[0];
        const gameId = game.id;
        const playersData = game.players || [];
        const votedPlayers = game.votedPlayers || [];

        // Get the total number of players in the game
        const totalPlayers = playersData.length;

        // Query rounds with this game ID
        const votesQuery = {
            round: {
                $: {
                    where: { gameId: gameId },
                },
                round: {},
            },
        };

        const votesData = await db.query(votesQuery);

        if (!votesData?.round || votesData.round.length === 0) {
            return NextResponse.json(
                { error: 'No rounds found for this game' },
                { status: 404 }
            );
        }

        // Get all votes across all rounds
        const allRounds = votesData.round;
        const allVotes = allRounds.flatMap(round => round.votes || []);

        // Create a hashmap to count total votes for each player
        const totalVoteCountMap = {};

        // Initialize with 0 for all players in the game
        playersData.forEach(player => {
            totalVoteCountMap[player.name] = 0;
        });

        // Initialize with 0 for any voters not in players list
        allVotes.forEach(vote => {
            if (!totalVoteCountMap.hasOwnProperty(vote.voter)) {
                totalVoteCountMap[vote.voter] = 0;
            }
        });

        // Count total votes
        allVotes.forEach(vote => {
            if (totalVoteCountMap.hasOwnProperty(vote.votedFor)) {
                totalVoteCountMap[vote.votedFor] += 1;
            } else {
                totalVoteCountMap[vote.votedFor] = 1;
            }
        });

        // Prepare response
        const response = {
            votes: allVotes,
            totalVoteCounts: totalVoteCountMap,
            votedPlayers: votedPlayers, // Include the list of players who have voted
            submittedPlayers: game.submittedPlayers || [], // Include players who submitted answers
            totalPlayers: totalPlayers // Add the total number of players
        };

        // If roundId is specified, add round-specific data
        if (roundId) {
            const specificRound = allRounds.find(round => round.id === roundId);

            if (!specificRound) {
                return NextResponse.json(
                    { error: 'Round not found' },
                    { status: 404 }
                );
            }

            const roundVotes = specificRound.votes || [];
            const submissions = specificRound.submissions || [];

            // Create a hashmap to count round-specific votes
            const roundVoteCountMap = {};

            // Initialize with 0 for all players with submissions
            submissions.forEach(submission => {
                const playerName = submission.playerName || "Unknown";
                roundVoteCountMap[playerName] = 0;
            });

            // Initialize with 0 for all game players as a fallback
            playersData.forEach(player => {
                if (!roundVoteCountMap.hasOwnProperty(player.name)) {
                    roundVoteCountMap[player.name] = 0;
                }
            });

            // Count round-specific votes
            roundVotes.forEach(vote => {
                if (roundVoteCountMap.hasOwnProperty(vote.votedFor)) {
                    roundVoteCountMap[vote.votedFor] += 1;
                } else {
                    roundVoteCountMap[vote.votedFor] = 1;
                }
            });

            // Add round-specific data to response
            response.roundId = roundId;
            response.votes = roundVotes; // Use just the votes for this round
            response.roundVoteCounts = roundVoteCountMap;
            response.submissions = submissions; // Include submissions for this round

            // Calculate eligible voters (players who submitted answers minus the current player)
            // This helps the client determine if everyone has voted
            const eligibleVoters = submissions.map(s => s.playerId || s.id);
            response.eligibleVoters = eligibleVoters;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error querying votes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch votes', details: error.message },
            { status: 500 }
        );
    }
}