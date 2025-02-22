import { init, id } from '@instantdb/admin';
import { NextResponse } from 'next/server';

const APP_ID = "98c74b4a-d255-4e76-a706-87743b5d7c07";
const db = init({
    appId: APP_ID,
    adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { gameCode, playerId, answer } = body;

        // Validate required fields
        if (!gameCode || !playerId || !answer) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        const roundId = id()

        const query = {
            games: {
                $: {
                    where: { gameCode: gameCode },
                },
            },
        };

        const data = await db.query(query);

        if (!data?.games?.[0]) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }
        const gameId = data.games[0].id;

        // Update the round and game using correct InstantDB syntax
        const res = await db.transact([
            db.tx.round[roundId].update({
                submissions: {
                    [playerId]: {
                        answer,
                        timestamp: Date.now()
                    }
                }
            }),
            db.tx.games[gameId].link({
                roundData: roundId
            })
        ]);

        return NextResponse.json({ 
            success: true, 
            transactionId: res['tx-id'] 
        });

    } catch (error) {
        console.error('Error submitting answer:', error);
        return NextResponse.json(
            { error: 'Failed to submit answer' },
            { status: 500 }
        );
    }
} 