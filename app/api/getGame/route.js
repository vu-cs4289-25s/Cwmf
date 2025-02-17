import { adminAPI } from "@instantdb/admin";
import { NextResponse } from 'next/server';

const APP_ID = "98c74b4a-d255-4e76-a706-87743b5d7c07";
const admin = adminAPI({ appId: APP_ID });

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

        const query = {
            games: {
                $: {
                    where: { gameCode: gameCode },
                },
            },
        };

        const data = await admin.query(query);

        if (!data?.games?.[0]) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data.games[0]);

    } catch (error) {
        console.error('Error fetching game:', error);
        return NextResponse.json(
            { error: 'Failed to fetch game' },
            { status: 500 }
        );
    }
}
