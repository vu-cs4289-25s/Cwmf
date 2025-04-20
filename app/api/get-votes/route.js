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

        const gameId = gameIdData.games[0].id;
        const playersData = gameIdData.games[0].players;

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
            totalVotes: allVotes,
            totalVoteCounts: totalVoteCountMap
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

            // Get unique voters for this round
            const uniqueVoters = new Set();
            roundVotes.forEach(vote => {
                if (vote.voter) {
                    uniqueVoters.add(vote.voter);
                }
            });

            // Create a hashmap to count round-specific votes
            const roundVoteCountMap = {};

            // Initialize with 0 for all players in the game
            playersData.forEach(player => {
                roundVoteCountMap[player.name] = 0;
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
            response.roundVotes = roundVotes;
            response.roundVoteCounts = roundVoteCountMap;
            response.uniqueVoterCount = uniqueVoters.size; // Add this for easier tracking
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