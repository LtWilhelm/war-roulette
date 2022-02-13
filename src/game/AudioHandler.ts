const SoundClips = {
  bang: 'bang.mp3',
  blaggard: 'blaggard.mp3',
  boom: 'boom.mp3',
  fight_me: 'fight_me.mp3',
  fite_me: 'fite_me.mp3',
  for_the_emperor: 'for_the_emperor.mp3',
  have_at_ye: 'have_at_ye.mp3',
  kablooie: 'kablooie.mp3',
  ratatatata: 'ratatatata.mp3',
}

type audioOption = keyof typeof SoundClips

export const audioHandler = (type: audioOption | 'fight' | 'shoot') => {
  const audio = new Audio();

  if (type === 'fight') {
    const fightSounds: audioOption[] = [
      'blaggard',
      'fight_me',
      'fite_me',
      'for_the_emperor',
      'have_at_ye'
    ]

    type = fightSounds[Math.floor(Math.random() * fightSounds.length)]
    if (type === 'have_at_ye') console.log("Honestly, I know this probably sounds like Spiff, but I PROMISE it's me");
  }
  if (type === 'shoot') {
    const fightSounds: audioOption[] = [
      'bang',
      'boom',
      'kablooie',
      'ratatatata'
    ]

    type = fightSounds[Math.floor(Math.random() * fightSounds.length)]
  }
  audio.src = `${window.location.host.includes('github') ? '/war-roulette/public' : ''}/sounds/${SoundClips[type]}`

  return audio;
}