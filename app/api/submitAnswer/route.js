import { init,id } from '@instantdb/admin';
import { NextResponse } from 'next/server';

const APP_ID = "98c74b4a-d255-4e76-a706-87743b5d7c07";
const db = init({
    appId: APP_ID,
    adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { gameId, playerId, answer } = body;

        // Validate required fields
        if (!gameId || !playerId || !answer) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        const roundId = id()

        // Update the game with the new submission using correct InstantDB syntax
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