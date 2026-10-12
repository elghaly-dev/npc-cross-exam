// The Opera Score: the third case. Server only. Nothing in this file is sent to the
// browser except what publicCase() in ./index.js picks out.

const c = (about, slot, value) => ({ about, slot, value });

export const operaScore = {
  id: 'opera-score',
  title: 'The Opera Score',
  teaser: "A composer's handwritten page is swapped for a copy before the matinee.",
  item: ['page', 'score', 'original'],
  accuseQuestion: 'Who took the final page?',
  intro:
    "Matinee day at the Corvo Opera House. Between 14:00 and 15:00 someone took the composer's " +
    'handwritten final page from the rehearsal-room cabinet and left a copy in its place. Three ' +
    'people were backstage. Find out who is lying, then make your accusation.',
  questionBudget: 24,
  startEvidence: ['copy_page'],
  culprit: 'ines',
  solution:
    'Ines rode the service lift up from the archive at 14:22 with her trolley, opened the cabinet ' +
    'with her archive card at 14:26, swapped the original for a photocopy and went back down at ' +
    '14:34. Lena lied to hide that she left the rehearsal room unlocked to sign for a delivery. ' +
    'Marco lied about the warm-up because he was on a secret audition call, but he saw Ines push ' +
    'the trolley past his dressing room.',

  slots: {
    'lena.room_locked_1400': {
      question: 'Did Lena lock the rehearsal room at 14:00?',
      yes: 'Lena locked the rehearsal room at 14:00.',
      no: 'Lena left the rehearsal room unlocked.',
    },
    'lena.in_prompt_corner': {
      question: 'Was Lena in the prompt corner the whole time from 14:10 to 14:40?',
      yes: 'Lena was in the prompt corner from 14:10 to 14:40.',
      no: 'Lena was away from the prompt corner between 14:10 and 14:40.',
    },
    'marco.at_warmup': {
      question: 'Was Marco at the full warm-up on stage from 14:00 to 14:45?',
      yes: 'Marco was at the full warm-up on stage.',
      no: 'Marco missed the warm-up.',
    },
    'marco.in_dressing_room': {
      question: 'Was Marco in dressing room 4 during the warm-up?',
      yes: 'Marco was in dressing room 4 during the warm-up.',
      no: 'Marco was not in dressing room 4 during the warm-up.',
    },
    'ines.upstairs_after_1400': {
      question: 'Was Ines upstairs, out of the archive, at any time after 14:00?',
      yes: 'Ines came upstairs after 14:00.',
      no: 'Ines stayed in the basement archive after 14:00.',
    },
    'ines.in_corridor_1425': {
      question: 'Was Ines in the dressing-room corridor with the archive trolley around 14:25?',
      yes: 'Ines was in the corridor with the archive trolley around 14:25.',
      no: 'Ines was not in the corridor that afternoon.',
    },
    'ines.card_in_desk': {
      question: "Did Ines's archive card stay in her desk all afternoon?",
      yes: "Ines's archive card stayed in her desk.",
      no: "Ines's archive card left her desk.",
    },
    'ines.swapped_page': {
      question: 'Did Ines swap the page?',
      yes: 'Ines swapped the page.',
      no: 'Ines did not swap the page.',
    },
    'case.page_swapped': {
      question: 'Was the original page swapped for a copy?',
      yes: 'The original page was swapped for a copy.',
      no: 'The page in the cabinet is the original.',
    },
  },

  evidence: {
    copy_page: {
      title: 'Page in the cabinet',
      text: 'A photocopy on modern paper. The 1890 original is gone.',
      holder: null,
      facts: [c('case', 'page_swapped', 'yes')],
    },
    lift_log: {
      title: 'Service lift log',
      text: '14:22 archive card I. DUARTE, basement to floor 2. 14:34 same card, floor 2 to basement.',
      holder: 'marco',
      handOverWhen: 'the detective asks about the lift, the corridor, noises, or who came up from below',
      facts: [c('ines', 'upstairs_after_1400', 'yes'), c('ines', 'card_in_desk', 'no')],
    },
    delivery_note: {
      title: 'Loading dock delivery note',
      text: 'Costume delivery signed at the loading dock, 14:18: L. FISCHER.',
      holder: 'ines',
      handOverWhen: 'the detective asks about the stage manager, deliveries, or who else was backstage',
      facts: [c('lena', 'in_prompt_corner', 'no')],
    },
    warmup_register: {
      title: 'Warm-up register',
      text: 'Full company warm-up, 14:00 to 14:45. M. Bellini: absent.',
      holder: 'lena',
      handOverWhen: 'the detective asks about the warm-up, the singers, or who was on stage',
      facts: [c('marco', 'at_warmup', 'no')],
    },
  },

  suspects: {
    lena: {
      name: 'Lena Fischer',
      role: 'Stage manager',
      bio: 'Runs the backstage schedule. Says she locked the rehearsal room at 14:00 and never left the prompt corner.',
      suggestions: [
        'Where were you from 14:00 to 15:00?',
        'Who was on stage for the warm-up?',
        'Did you lock the rehearsal room?',
        'Is the page in the cabinet the original?',
      ],
      truth: [
        'At 14:10 you left the rehearsal room unlocked and went to the loading dock to sign for a costume delivery. You were back in the prompt corner at 14:40.',
        'Leaving the room unlocked breaks house rules, and you could lose your job.',
        'You keep the warm-up register. The understudy tenor, Marco, was marked absent.',
        'You hope the page was only misfiled, because then nothing was taken on your watch.',
      ],
      story: 'You locked the rehearsal room at 14:00 and stayed in the prompt corner all hour. You think the page was only misfiled.',
      crackOn: ['delivery_note'],
      crackAdmit: 'You admit you left the room unlocked and were at the loading dock signing for a delivery from about 14:10 to 14:40.',
      neverAdmit: [],
      holdLine: "I've told you. I run a tight backstage.",
    },
    marco: {
      name: 'Marco Bellini',
      role: 'Understudy tenor',
      bio: 'Covers the lead tonight. Says he sang through the whole warm-up on stage.',
      suggestions: [
        'Where were you during the warm-up?',
        'Did you hear anything in the corridor?',
        'Who could open the cabinet?',
        'What do you think of the stage manager?',
      ],
      truth: [
        'You skipped the warm-up for a secret video audition with another company, alone in dressing room 4 from 14:00 to 14:45.',
        'At about 14:25 you heard the archive trolley squeak and saw the archivist, Ines, push it past your door toward the rehearsal room.',
        'Building staff post the service lift log by the stage door. You took a photo of it when you came in.',
        'You are afraid that admitting the audition will cost you your understudy role.',
      ],
      story: 'You were on stage for the full warm-up from 14:00 to 14:45 and saw nobody.',
      crackOn: ['warmup_register'],
      crackAdmit: 'You admit you skipped the warm-up for an audition call in dressing room 4, and that you saw Ines push the archive trolley past your door at about 14:25.',
      neverAdmit: [],
      holdLine: "I've said what I saw. I just want to sing tonight.",
    },
    ines: {
      name: 'Ines Duarte',
      role: 'Archivist',
      bio: 'Looks after the house archive in the basement. Says she never came upstairs all afternoon.',
      suggestions: [
        'Were you upstairs this afternoon?',
        'Where was your archive card?',
        'Who else was backstage?',
        'Who would want the original?',
      ],
      truth: [
        'At 14:22 you took the service lift up from the basement with the archive trolley.',
        'At 14:26 you opened the cabinet with your archive card, swapped the original page for a photocopy and hid it in a folder on the trolley.',
        'You went back down at 14:34. A private collector has offered to buy the page.',
      ],
      story: 'You were in the basement archive all afternoon. Your archive card stayed in your desk drawer. You have not been upstairs since the morning.',
      crackOn: ['lift_log'],
      crackAdmit: 'You admit only that you went up at 14:22 "to return a costume book" and came back down at 14:34. You keep denying the corridor, the cabinet and the page.',
      neverAdmit: [c('ines', 'swapped_page', 'yes')],
      holdLine: 'I did not touch that page. I have looked after this archive for twenty years.',
    },
  },

  mock: {
    lena: {
      intents: [
        { when: /\b(warm-?ups?|singers?|on stage|register|company)\b/i,
          reply: 'I keep the warm-up register. Here, see for yourself who signed in.',
          reveals: ['warmup_register'] },
        { when: /\b(lock\w*|unlock\w*|keys?|doors?)\b/i,
          reply: 'I locked it at two, like every day.',
          claims: [c('lena', 'room_locked_1400', 'yes')],
          after: {
            reply: 'I left it unlocked when I went to the dock. I know.',
            claims: [c('lena', 'room_locked_1400', 'no')] } },
        { when: /\b(original|cop(y|ies)|swap\w*|misfiled|pages?|score)\b/i,
          reply: "It's probably misfiled. Nothing has been taken, I'm sure of it.",
          claims: [c('case', 'page_swapped', 'no')] },
        { when: /\b(marco|tenor|understudy|bellini)\b/i,
          reply: "Marco? He's hungry for the lead. Check the register." },
        { when: /\b(ines|archivist|archive|duarte)\b/i,
          reply: 'Ines hardly ever comes up from the basement on matinee days.' },
        { when: /\b(deliver\w*|dock|costumes?|loading)\b/i,
          reply: 'What delivery? I was here.',
          claims: [c('lena', 'in_prompt_corner', 'yes')],
          after: {
            reply: 'I signed for the costumes at the loading dock at 14:18.',
            claims: [c('lena', 'in_prompt_corner', 'no')] } },
        { when: /\b(where|hour|afternoon|prompt corner|between|whole)\b/i,
          reply: 'In the prompt corner, all hour.',
          claims: [c('lena', 'in_prompt_corner', 'yes')],
          after: {
            reply: 'From ten past two I was at the loading dock. Back at twenty to three.',
            claims: [c('lena', 'in_prompt_corner', 'no')] } },
      ],
      fallback: {
        reply: 'I was in the prompt corner all afternoon.',
        claims: [c('lena', 'in_prompt_corner', 'yes')],
        after: { reply: "That's all. The dock, the delivery, and the door I left open." },
      },
      present: {
        delivery_note: {
          crack: true,
          reply: 'Fine. I left the room unlocked at ten past two and went to sign for the costumes at the loading dock. I was back at twenty to three.',
          claims: [c('lena', 'room_locked_1400', 'no'), c('lena', 'in_prompt_corner', 'no')],
        },
        lift_log: { reply: 'Ines came up? She told me she never leaves the basement on matinee days.' },
        warmup_register: { reply: 'I marked him absent myself.' },
        copy_page: {
          reply: 'A copy? Then someone planned this.',
          claims: [c('case', 'page_swapped', 'yes')] },
      },
      presentOther: { reply: "I don't know what that is." },
      repeatCrack: { reply: "I've told you. The dock, and the open door." },
    },

    marco: {
      intents: [
        { when: /\b(lifts?|elevator|corridor|noises?|hear|heard|trolley|squeak\w*|below)\b/i,
          reply: 'The service lift log is posted by the stage door. I took a photo of it when I came in. Here.',
          reveals: ['lift_log'] },
        { when: /\b(ines|archivist|archive|duarte)\b/i,
          reply: "Ines? I was on stage, I wouldn't know.",
          after: {
            reply: 'Ines pushed the archive trolley past my door at about 14:25.',
            claims: [c('ines', 'in_corridor_1425', 'yes')] } },
        { when: /\b(cabinet|open\w*|cards?|keys?)\b/i,
          reply: 'Only an archive card opens that cabinet. Singers never touch it.' },
        { when: /\b(lena|stage manager|fischer)\b/i,
          reply: 'Lena runs everything to the minute. She would notice if I were missing.' },
        { when: /\b(where|warm-?ups?|stage|sing\w*|audition\w*|dressing)\b/i,
          reply: 'On stage, warming up with everyone, two till quarter to three.',
          claims: [c('marco', 'at_warmup', 'yes'), c('marco', 'in_dressing_room', 'no')],
          after: {
            reply: 'I was in dressing room 4 on an audition call. I skipped the warm-up.',
            claims: [c('marco', 'at_warmup', 'no'), c('marco', 'in_dressing_room', 'yes')] } },
      ],
      fallback: {
        reply: 'I was singing on stage the whole time.',
        claims: [c('marco', 'at_warmup', 'yes')],
        after: {
          reply: "I've told you. The audition, and Ines with her trolley.",
          claims: [c('ines', 'in_corridor_1425', 'yes')] },
      },
      present: {
        warmup_register: {
          crack: true,
          reply: 'All right. I skipped the warm-up for an audition call in dressing room 4. At about 14:25 I saw Ines push the archive trolley past my door, toward the rehearsal room.',
          claims: [
            c('marco', 'at_warmup', 'no'),
            c('marco', 'in_dressing_room', 'yes'),
            c('ines', 'in_corridor_1425', 'yes'),
          ],
        },
        lift_log: { reply: 'That is the photo I took. Her card, going up.' },
        delivery_note: { reply: "So Lena wasn't in the prompt corner." },
        copy_page: { reply: 'A copy? Someone had time to prepare.' },
      },
      presentOther: { reply: "I've never seen that." },
      repeatCrack: { reply: "I've told you. The audition, and the trolley." },
    },

    ines: {
      intents: [
        { when: /\b(who else|anyone else|backstage|others?|lena|stage manager|deliver\w*)\b/i,
          reply: 'Ask the stage manager where she was. I filed the loading dock delivery note myself. Here.',
          reveals: ['delivery_note'] },
        { when: /\b(cards?|badges?|keys?)\b/i,
          reply: 'My archive card stayed in my desk drawer all afternoon.',
          claims: [c('ines', 'card_in_desk', 'yes')],
          after: {
            reply: 'I used my card for the lift. Nothing else.',
            claims: [c('ines', 'card_in_desk', 'no')] } },
        { when: /\b(corridor|trolley|dressing)\b/i,
          reply: 'A trolley? I had no reason to bring a trolley upstairs.',
          claims: [c('ines', 'in_corridor_1425', 'no')] },
        { when: /\b(collectors?|sell|money|want\w*|original|value)\b/i,
          reply: "Anyone who loves music would want it. I would never sell a page of this house." },
        { when: /\b(swap\w*|took|take|steal|stole|pages?|cabinet|cop(y|ies))\b/i,
          reply: "I didn't touch the page.",
          claims: [c('ines', 'swapped_page', 'no')] },
        { when: /\b(upstairs|where|afternoon|basement|lifts?|came up|went up)\b/i,
          reply: "I was in the basement archive all afternoon. I haven't been upstairs since the morning.",
          claims: [c('ines', 'upstairs_after_1400', 'no')],
          after: {
            reply: 'I went up at 14:22 to return a costume book. I was back down by 14:34.',
            claims: [c('ines', 'upstairs_after_1400', 'yes')] } },
      ],
      fallback: {
        reply: 'I was in the archive. I know nothing about this.',
        claims: [c('ines', 'upstairs_after_1400', 'no')],
        after: {
          reply: "I went up to return a book. That's all.",
          claims: [c('ines', 'upstairs_after_1400', 'yes')] },
      },
      present: {
        lift_log: {
          crack: true,
          reply: 'Very well. I went up at 14:22 to return a costume book and came straight back down at 14:34. I never went near the rehearsal room.',
          claims: [
            c('ines', 'upstairs_after_1400', 'yes'),
            c('ines', 'card_in_desk', 'no'),
            c('ines', 'swapped_page', 'no'),
          ],
        },
        delivery_note: { reply: 'Lena signed for costumes while the room stood open.' },
        warmup_register: { reply: "So Marco wasn't on stage at all." },
        copy_page: { reply: 'A copy. Clever work. Not mine.' },
      },
      presentOther: { reply: 'That means nothing to me.' },
      repeatCrack: { reply: 'I told you. I returned a book. That was all.' },
    },
  },
};
