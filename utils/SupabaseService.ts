import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cjnswuamnsmyoiwilbuf.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseService {

    public async getPlayerWithScores(id: number): Promise<PlayerWithScores | null> {
        const { data, error } = await supabase
            .from('player')
            .select('*, match_score!match_scores_player_id_fkey(*)')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Spieler mit der ID ' + id + ' konnte nicht gefunden werden.');
            return null;
        }

        return data;
    }
    async savePlayer(player: Player): Promise<boolean> {
        const { data, error } = await supabase.from('player').insert(player);
        if (error) {
            console.error('Konnte keinen neuen Player-Eintrag erstellen:', error.message);
            return false;
        }

        return true;
    }

    async updatePlayer(player: Player): Promise<boolean> {
        const { data, error } = await supabase
            .from('player')
            .update({
                name: player.name,
                average_score: player.average_score,
                average_placement: player.average_placement
            })
            .eq('id', player.id);

        if (error) {
            console.error('Konnte Player nicht aktualisieren:', error.message);
            return false;
        }

        return true;
    }

    async saveScore(matchScore: MatchScore): Promise<boolean> {
        const { data, error } = await supabase.from('match_score').insert(matchScore);
        if (error) {
            console.error('Konnte keinen neuen Match-Score-Eintrag erstellen:', error.message);
            return false;
        }

        return true;
    }
}
