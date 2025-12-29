import { createClient } from '@supabase/supabase-js'
import { PlayerRecord } from "./types/Record";

const supabaseUrl = 'https://cjnswuamnsmyoiwilbuf.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseService {

    public async getPlayersWithScores(): Promise<Player[] | null> {
        const { data, error } = await supabase
            .from('player')
            .select('*, match_score!match_scores_player_id_fkey(*)');

        if (error) {
            console.error('Spieler konnten nicht gefunden werden.');
            return null;
        }

        return data;
    }

    public async getPlayerRecords(): Promise<PlayerRecord[] | null> {
        const { data, error } = await supabase
            .from('record')
            .select('*, player(*)' );

        if (error) {
            console.error('Rekorde konnten nicht gefunden werden.');
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
        console.log(matchScore);
        const { data, error } = await supabase.from('match_score').insert(matchScore);
        if (error) {
            console.error('Konnte keinen neuen Match-Score-Eintrag erstellen:', error.message);
            return false;
        }

        console.log('Match score saved');

        return true;
    }

    async saveRecord(playerRecord: PlayerRecord): Promise<boolean> {
        const recordId = playerRecord.id;

        if (!recordId) {
            console.error('Keine ID im PlayerRecord gefunden.');
            return false;
        }

        const updates = Object.fromEntries(
            Object.entries(playerRecord).filter(([key, value]) => value !== null && key !== 'id')
        );

        if (Object.keys(updates).length === 0) {
            console.log('Keine neuen Werte zum Speichern vorhanden.');
            return true;
        }

        console.log('Sende Update an DB:', updates, 'für ID:', recordId);

        const { data, error } = await supabase
            .from('record')
            .update(updates)
            .eq('id', recordId);

        if (error) {
            console.error('Konnte keinen Match-Score-Eintrag aktualisieren:', error.message);
            return false;
        }

        console.log('Match score saved successfully');
        return true;
    }
}
