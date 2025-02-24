import { init} from "@instantdb/admin";
import { NextResponse } from 'next/server';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const db = init({
    appId: APP_ID,
    adminToken: process.env.NEXT_PUBLIC_INSTANT_APP_ADMIN_TOKEN,
});

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');

    const query = {
        round: {
            $: {
                where: { id: roundId },
            },
            submissions: {}
        },
    };

    const data = await db.query(query);

    return NextResponse.json(data.round);
}