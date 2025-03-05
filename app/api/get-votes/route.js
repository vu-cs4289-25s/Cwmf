import { init} from "@instantdb/admin";
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

        // Return the votes data
        const allVotes = votesData.round.flatMap(round => round.votes || []);
        
        // Create a hashmap to count votes for each player
        const voteCountMap = {};
        
        // Initialize with 0 for all voters
        allVotes.forEach(vote => {
            if (!voteCountMap[vote.voter]) {
                voteCountMap[vote.voter] = 0;
            }
        });
        
        // Count votes
        allVotes.forEach(vote => {
            if (voteCountMap.hasOwnProperty(vote.votedFor)) {
                voteCountMap[vote.votedFor] += 1;
            } else {
                voteCountMap[vote.votedFor] = 1;
            }
        });
        
        return NextResponse.json({ 
            votes: allVotes,
            voteCounts: voteCountMap
        });
    } catch (error) {
        console.error('Error querying votes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch votes', details: error.message },
            { status: 500 }
        );
    }
}