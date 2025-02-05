import { init, id } from "@instantdb/admin";
import { NextResponse } from 'next/server';

const APP_ID = "98c74b4a-d255-4e76-a706-87743b5d7c07";
const INSTANTDB_ADMIN_SECRET = process.env.INSTANTDB_ADMIN_SECRET;

// Fail fast if admin secret is not configured
if (!INSTANTDB_ADMIN_SECRET) {
    throw new Error('INSTANTDB_ADMIN_SECRET environment variable is not configured');
}

const db = init({
    appId: APP_ID,
    adminToken: INSTANTDB_ADMIN_SECRET,
});

export async function GET(request) {
    try {
        // Get the game code from the URL search params
        const { searchParams } = new URL(request.url);
        const gameCode = searchParams.get('gameCode');

        if (!gameCode) {
            return NextResponse.json(
                { error: 'Game code is required' },
                { status: 400 }
            );
        }

        // Simplified query structure
        const data = await db.query({ 
            games: {} 
        });

        const { games } = data;

        if (!games?.[0]) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }

        // Find the game with matching gameCode
        const game = games.find(g => g.gameCode === gameCode);
        if (!game) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(game);

    } catch (error) {
        console.error('Error fetching game:', error);
        return NextResponse.json(
            { error: 'Failed to fetch game' },
            { status: 500 }
        );
    }
}
