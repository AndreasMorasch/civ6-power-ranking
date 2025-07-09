<script setup lang="ts">
import {SupabaseService} from '/utils/SupabaseService';
import {onMounted, ref} from "vue";

const supabaseService = new SupabaseService();
const isOpen = ref(false);
const playerBeingModified = ref<Player>();
const gameNumber = ref<number | null>(null);
const points = ref<number | null>(null);
const character = ref('');

function open(player: Player) {
  isOpen.value = true;
  playerBeingModified.value = player;
}

function close() {
  isOpen.value = false;
}

async function save() {
  const matchScore: MatchScore = {
    player_id: playerBeingModified.value.id,
    game_nr: gameNumber.value,
    character: character.value,
    points: points.value
  }

  const success = await supabaseService.saveScore(matchScore);
  console.log(success);
  // todo: die variablen wieder clearen
  close();
  location.reload();
}

const players = ref<Player[]>([])

onMounted(async () => {
  const loadedPlayers = await getPlayers();

  // Sortieren nach average_points (höchste zuerst)
  loadedPlayers.sort((a, b) => {
    // Falls null-Werte vorkommen, behandle sie als 0 oder setze sie nach hinten
    const aPoints = a.average_placement ?? -Infinity;
    const bPoints = b.average_placement ?? -Infinity;

    return aPoints - bPoints;
  });

  players.value = loadedPlayers;
})

async function getPlayers(): Promise<Player[]> {
  const players: Player[] = await supabaseService.getPlayersWithScores() ?? [];

  // Gruppieren nach game_nr
  const scoresByGame: Record<number, MatchScore[]> = {};

  for (const player of players) {
    if (!player.match_score) continue;

    for (const score of player.match_score) {
      if (score.game_nr === null) continue;

      if (!scoresByGame[score.game_nr]) {
        scoresByGame[score.game_nr] = [];
      }

      scoresByGame[score.game_nr].push(score);
    }
  }

  // Berechnungen
  for (const player of players) {
    const scores = player.match_score?.filter(s => s.points !== null) ?? [];

    const totalPoints = scores.reduce((sum, s) => sum + (s.points ?? 0), 0);
    player.average_points = scores.length > 0 ? totalPoints / scores.length : null;

    const placements: number[] = [];

    for (const score of scores) {
      const gameNr = score.game_nr!;
      const playerId = score.player_id;

      const allScoresThisGame = scoresByGame[gameNr];
      if (!allScoresThisGame) continue;

      const sorted = [...allScoresThisGame]
          .filter(s => s.points !== null)
          .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

      const rank = sorted.findIndex(s => s.player_id === playerId) + 1;
      if (rank > 0) placements.push(rank);
    }

    const totalPlacement = placements.reduce((sum, r) => sum + r, 0);
    player.average_placement = placements.length > 0 ? totalPlacement / placements.length : null;
  }

  return players;
}

function getBgColor(index: number): string {
  switch (index) {
    case 0:
      return 'bg-green-400'; // Platz 1
    case 1:
      return 'bg-green-300'; // Platz 2
    case 2:
    case 3:
    case 4:
      return 'bg-yellow-300'; // Platz 3-5
    case 5:
      return 'bg-red-300'; // Platz 6
    case 6:
      return 'bg-red-400'; // Platz 7
    default:
      return 'bg-gray-200'; // Fallback
  }
}

</script>

<template>
  <div class="relative w-full h-screen overflow-hidden">
    <img
        src="@/assets/wallpaper.jpg"
        alt="Background"
        class="absolute top-0 left-0 w-full h-full object-cover z-0"
    />

    <video
        autoplay
        muted
        loop
        playsinline
        class="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-10"
    >
      <source src="@/assets/smoke.mp4" type="video/mp4"/>
      Dein Browser unterstützt das Video nicht.
    </video>

    <video
        autoplay
        muted
        loop
        playsinline
        class="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-10"
    >
      <source src="@/assets/sparkles.mp4" type="video/mp4"/>
      Dein Browser unterstützt das Video nicht.
    </video>

    <!-- Normale Seitelemente -->
    <div class="relative z-20 p-4 h-screen">
      <div class="flex justify-center items-center m-auto max-w-10/12]">
        <img src="@/assets/headline.png" alt="headline">
      </div>

      <div class="flex flex-col flex-wrap sm:flex-row justify-center gap-8 px-8 h-full z-30">
        <div
            class="flex-1 h-3/4 rounded-lg shadow-md border-2 border-white bg-[rgba(133,63,63,0.5)] flex flex-col pb-2">
          <!-- Bild blockt nur so viel Platz wie nötig -->
          <img
              src="@/assets/player-ranking.png"
              alt="Spieler Ranking"
              class="w-full h-auto"
          />

          <div class="flex mx-4 text-sm text-white">
            <div class="flex-1 flex basis-[15%] justify-center items-center">Platz</div>
            <div class="flex-1 flex basis-[17%] justify-center items-center">Name</div>
            <div class="flex-1 flex basis-[8%] justify-center items-center">Games</div>
            <div class="flex-1 flex basis-[30%] justify-center items-center">⌀ Punkte</div>
            <div class="flex-1 flex basis-[30%] justify-center items-center">⌀ Platz</div>
          </div>

          <div
              v-for="(player, index) in players"
              :key="player.id"
              class="flex-1 flex flex-col space-y-1 overflow-hidden py-1"
          >
            <div
                class="flex-1 mx-2 rounded-2xl flex hover:outline-2 hover:outline-white"
                @click="open(player)"
                :class="getBgColor(index)"
            >
              <div class="flex-1 flex basis-[15%] text-2xl justify-center items-center">#{{ index + 1 }}</div>
              <div class="flex-1 flex basis-[17%] justify-center items-center">{{ player.name }}</div>
              <div class="flex-1 flex basis-[8%] justify-center items-center">{{ player.match_score.length }}</div>
              <div class="flex-1 flex basis-[30%] justify-center items-center text-center">⌀
                {{ player.average_points?.toFixed(2) ?? '-' }}
              </div>
              <div class="flex-1 flex basis-[30%] justify-center items-center">
                ⌀
                <img
                    src="@/assets/podium.svg"
                    alt="Podium"
                    class="h-4 w-4 mx-2"
                />
                {{ player.average_placement?.toFixed(2) ?? '-' }}
              </div>
            </div>
          </div>

        </div>

        <div class="flex-1 h-3/4 rounded-lg shadow-md border-2 border-white bg-[rgba(133,63,63,0.5)]">
          <img
              src="@/assets/all-time-records.png"
              alt="All-Time Rekorde"
          />
        </div>
      </div>
    </div>
  </div>

  <div
      v-if="isOpen"
      class="fixed inset-0 flex justify-center items-center z-70"
  >
    <div class="bg-white rounded-xl p-6 w-1/2 relative shadow-xl">
      <!-- Schließen Button -->
      <button
          @click="close"
          class="absolute top-2 right-2 text-gray-500 hover:text-black"
      >
        ✖
      </button>

      <!-- Modal Inhalt -->
      <div class="flex justify-center items-center">
        <h2 class="text-xl font-bold mb-4">Neuen Eintrag für {{ playerBeingModified.name }} hinzufügen</h2>
      </div>

      <div class="space-y-4">
        <label>Spiel Nummer / Id</label>
        <input
            type="number"
            v-model.number="gameNumber"
            placeholder="Spiel Nummer / Id"
            class="w-full border rounded p-2"
        />
        <label>Charakter</label>
        <input
            type="text"
            v-model="character"
            placeholder="Charakter"
            class="w-full border rounded p-2"
        />
        <label>Gesamtpunkte</label>
        <input
            type="number"
            v-model.number="points"
            placeholder="Gesamtpunkte"
            class="w-full border rounded p-2"
        />
      </div>

      <!-- Button -->
      <div class="mt-6 flex justify-end">
        <button
            @click="save"
            class="bg-[rgba(133,63,63)] text-white px-4 py-2 rounded hover:bg-amber-600"
        >
          Speichern
        </button>
      </div>
    </div>
  </div>

</template>
