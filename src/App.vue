<script setup lang="ts">
import {SupabaseService} from '/utils/SupabaseService';

const supabaseService = new SupabaseService();

initPlayers();

async function initPlayers() {
  const player: Player = await supabaseService.getPlayerWithScores(1);
  console.log(player);
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
      <div class="m-auto max-w-10/12]">
        <img src="@/assets/headline.png" alt="headline">
      </div>

      <div class="flex justify-center gap-8 px-8 h-full z-30">
        <div class="flex-1 h-3/4 rounded-lg shadow-md border-2 border-white bg-[rgba(133,63,63,0.5)] flex flex-col pb-2">
          <!-- Bild blockt nur so viel Platz wie nötig -->
          <img
              src="@/assets/player-ranking.png"
              alt="Spieler Ranking"
              class="w-full h-auto"
          />

          <div class="flex-1 flex flex-col space-y-1 overflow-hidden">
            <div class="flex-1 bg-green-500 mx-2 rounded-2xl flex">
              <div class="flex-1 flex text-3xl justify-center items-center">#1</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
            </div>
            <div class="flex-1 bg-green-400 mx-2 rounded-2xl flex">
              <div class="flex-1 flex text-3xl justify-center items-center">#2</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
            </div>
            <div class="flex-1 bg-yellow-200 mx-2 rounded-2xl flex">
              <div class="flex-1 flex text-3xl justify-center items-center">#3</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
            </div>
            <div class="flex-1 bg-yellow-200 mx-2 rounded-2xl flex">
              <div class="flex-1 flex text-3xl justify-center items-center">#4</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
            </div>
            <div class="flex-1 bg-yellow-200 mx-2 rounded-2xl flex">
              <div class="flex-1 flex text-3xl justify-center items-center">#5</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
            </div>
            <div class="flex-1 bg-red-300 mx-2 rounded-2xl flex">
              <div class="flex-1 flex text-3xl justify-center items-center">#6</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
            </div>
            <div class="flex-1 bg-red-500 mx-2 rounded-2xl flex">
              <div class="flex-1 flex text-3xl justify-center items-center">#7</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
              <div class="flex-1 flex justify-center items-center">TODO</div>
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

</template>
