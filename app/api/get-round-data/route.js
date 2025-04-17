// File: app/api/get-round-data/route.js
import { init } from "@instantdb/admin";
import { NextResponse } from 'next/server';

const db = init({
    appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
    adminToken: process.env.NEXT_PUBLIC_INSTANT_APP_ADMIN_TOKEN,
});

export async function GET(request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const roundId = searchParams.get('roundId');

        console.log("API: Fetching round data for roundId:", roundId);

        if (!roundId) {
            console.log("API: Missing roundId parameter");
            return NextResponse.json(
                { error: 'Round ID is required' },
                { status: 400 }
            );
        }

        // Get round data
        const roundQuery = {
            round: {
                $: {
                    where: { id: roundId },
                },
            },
        };

        const roundData = await db.query(roundQuery);
        console.log("API: Round query result:", JSON.stringify(roundData));

        if (!roundData?.round || roundData.round.length === 0) {
            console.log("API: Round not found for ID:", roundId);
            return NextResponse.json(
                { error: 'Round not found' },
                { status: 404 }
            );
        }

        const round = roundData.round[0];
        console.log("API: Found round with data:", {
            id: round.id,
            answers: Array.isArray(round.answers) ? round.answers.length : 'not an array',
            submittedPlayers: Array.isArray(round.submittedPlayers) ? round.submittedPlayers.length : 'not an array'
        });

        // If there are no answers or submittedPlayers, return the round as is
        if (!round.answers || !Array.isArray(round.answers) || round.answers.length === 0) {
            console.log("API: No answers found in round, returning as is");
            return NextResponse.json([round]);
        }

        // Get the game data to verify the round information
        const gameQuery = {
            games: {
                $: {
                    where: { id: round.gameId },
                },
            },
        };

        const gameData = await db.query(gameQuery);

        if (gameData?.games && gameData.games.length > 0) {
            const game = gameData.games[0];
            console.log("API: Game data found:", {
                id: game.id,
                currentRound: game.currentRound,
                answers: Array.isArray(game.answers) ? game.answers.length : 'not an array',
                submittedPlayers: Array.isArray(game.submittedPlayers) ? game.submittedPlayers.length : 'not an array'
            });
        }

        // If the round has answers but no submittedPlayers, try to get them from the game
        if ((!round.submittedPlayers || round.submittedPlayers.length === 0) &&
            gameData?.games?.[0]?.submittedPlayers) {
            round.submittedPlayers = gameData.games[0].submittedPlayers;
            console.log("API: Using submittedPlayers from game:", round.submittedPlayers);
        }

        // Create submission objects from the answers and submittedPlayers
        const submissions = [];
        const submittedPlayers = round.submittedPlayers || [];

        console.log("API: Creating submissions from:", {
            answers: round.answers.length,
            submittedPlayers: submittedPlayers.length
        });

        for (let i = 0; i < Math.min(round.answers.length, submittedPlayers.length); i++) {
            submissions.push({
                id: `submission_${roundId}_${i}`,
                playerId: submittedPlayers[i],
                answer: round.answers[i],
                roundId: roundId
            });
        }

        console.log("API: Created submissions:", submissions);

        // Add submissions to the round data
        const roundWithSubmissions = {
            ...round,
            submissions,
        };

        return NextResponse.json([roundWithSubmissions]);
    } catch (error) {
        console.error('API Error fetching round data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch round data', details: error.message },
            { status: 500 }
        );
    }
}