export interface Student {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  cost: number;
  avatar: string;
  prompt: string;
  voice: 'Puck' | 'Charon' | 'Kore' | 'Aoede' | 'Fenrir';
}

export const STUDENTS: Student[] = [
  {
    id: 'marko',
    name: 'Marko',
    description: 'Radoznao dečak koji voli da uči kroz primere.',
    difficulty: 'Easy',
    cost: 0,
    avatar: '/assets/kid_teach.jpg',
    prompt: 'Ti si dečak Marko, radoznao si i voliš jednostavna objašnjenja.',
    voice: 'Puck'
  },
  {
    id: 'jovana',
    name: 'Jovana',
    description: 'Umetnička duša, teže razume logiku, voli analogije i osećanja.',
    difficulty: 'Medium',
    cost: 300,
    avatar: '/assets/kid_teach.jpg', // Placeholder image
    prompt: 'Ti si Jovana, umetnica si i voliš da povezuješ gradivo sa snovima i osećanjima. Teže razumeš logičke zavrzlame.',
    voice: 'Kore'
  },
  {
    id: 'stefan',
    name: 'Stefan',
    description: 'Fudbaler koji misli samo na loptu. Sve moraš da mu objasniš preko sporta.',
    difficulty: 'Medium',
    cost: 600,
    avatar: 'https://ais-pre-cmziv3yrjj4xjtcvaferrr-198919849439.europe-west2.run.app/api/artifacts/89e7c376-b962-4b77-8fa2-68c160538f71',
    prompt: 'Ti si Stefan, fudbaler si. Ne zanima te teorija, samo kako se to primenjuje na terenu. Koristi fudbalske metafore.',
    voice: 'Charon'
  },
  {
    id: 'viktor',
    name: 'Viktor',
    description: 'Mali skeptik - traži matematičku preciznost i strogu logiku.',
    difficulty: 'Hard',
    cost: 1200,
    avatar: '/assets/kid_teach.jpg', // Placeholder image
    prompt: 'Ti si Viktor, veoma si pametan i skeptičan prema površnim objašnjenjima. Tražiš matematičku preciznost i logiku.',
    voice: 'Charon'
  },
  {
    id: 'vuk',
    name: 'Prof. Vuk',
    description: 'Arogantni genije. Prezire svako objašnjenje koje nije akademsko.',
    difficulty: 'Extreme',
    cost: 2500,
    avatar: '/assets/kid_teach.jpg', // Placeholder image
    prompt: 'Ti si Vuk, genijalni ali arogantni student. Prezireš svako objašnjenje koje nije na vrhunskom nivou. Teško te je impresionirati.',
    voice: 'Fenrir'
  }
];
