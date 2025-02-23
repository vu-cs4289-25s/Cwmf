"use client";
import { useParams, useRouter } from "next/navigation";
// ... other imports remain the same

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id;
  const roundId = params.roundId;

  // Subscribe to game and round state
  const { data } = db.useQuery({
    games: {
      $: {
        where: { gameCode: gameId },
      },
    },
    rounds: {
      $: {
        where: { id: roundId },
      },
    },
  });

  const game = data?.games?.[0];
  const currentRound = data?.rounds?.[0];

  const handleStageComplete = async () => {
    if (!game) return;

    const nextStage = getNextStage(game.currentStage);
    
    // If moving to PREP stage, create new round and redirect
    if (nextStage === "PREP") {
      const newRoundId = `round_${Date.now()}`;
      
      // Create new round in database
      await db.transact([
        db.tx.rounds.create({
          id: newRoundId,
          gameId: game.id,
          roundNumber: (currentRound.roundNumber || 1) + 1,
          answers: [],
          submittedPlayers: [],
          votes: [],
          theme: game.theme,
          prompt: game.prompt,
        }),
        db.tx.games[game.id].update({
          currentStage: nextStage,
          timerStart: Date.now(),
          timeLeft: getStageDuration(nextStage),
          isTimerRunning: true,
        })
      ]);

      // Redirect all players to the new round
      router.push(`/game/${gameId}/play/${newRoundId}`);
    } else {
      // Just update the stage
      await db.transact(
        db.tx.games[game.id].update({
          currentStage: nextStage,
          timerStart: Date.now(),
          timeLeft: getStageDuration(nextStage),
          isTimerRunning: true,
        })
      );
    }
  };
} 