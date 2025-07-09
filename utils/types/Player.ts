export {};

declare global {
    /** Representing the structure of a player. */
    interface Player {
        id: number | null;
        name: string | null;
        match_score: MatchScore[] | null;

        // calculated afterward
        average_placement: number | null;
        average_points: number | null;
    }
}
