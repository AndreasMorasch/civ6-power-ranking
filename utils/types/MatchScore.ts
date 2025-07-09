export {};

declare global {
    interface MatchScore {
        player_id: number | null;
        game_nr: number | null;
        character: string | null;
        points: number | null;
    }
}
