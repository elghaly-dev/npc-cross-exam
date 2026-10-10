// The Greenhouse Orchid: the second case. Server only. Nothing in this file is sent to
// the browser except what publicCase() in ./index.js picks out.

const c = (about, slot, value) => ({ about, slot, value });

export const greenhouseOrchid = {
  id: 'greenhouse-orchid',
  title: 'The Greenhouse Orchid',
  teaser: 'A rare orchid vanishes from a locked cabinet at closing time.',
  item: ['orchid'],
  accuseQuestion: 'Who took the orchid?',
  intro:
    'Closing time at Willow Botanical Garden. Between 18:00 and 19:00 someone opened the ' +
    'climate cabinet in Greenhouse 3 and took the ghost orchid, the rarest plant in the ' +
    'collection. Three people were still around. Find out who is lying, then make your accusation.',
  questionBudget: 24,
  startEvidence: ['keypad_log'],
  culprit: 'jonah',
  solution:
    'Jonah came back through the staff gate at 18:15 on his volunteer card, opened the ' +
    'cabinet at 18:22 with the code from the note under the potting bench, and left at 18:30 ' +
    'with the orchid in a cool box. Mira lied to hide a long phone call in the office and the ' +
    'note with the code. Celeste lied about leaving at 17:45 because she had stayed to sketch ' +
    'after closing, but she saw Jonah carry the cool box to the staff gate.',

  slots: {
    'mira.in_greenhouse_1810_1840': {
      question: 'Was Mira inside Greenhouse 3 the whole time from 18:10 to 18:40?',
      yes: 'Mira was in Greenhouse 3 from 18:10 to 18:40.',
      no: 'Mira was away from Greenhouse 3 between 18:10 and 18:40.',
    },
    'mira.code_written_down': {
      question: 'Was the cabinet code written down anywhere?',
      yes: 'The cabinet code was on a note under the potting bench.',
      no: 'The cabinet code was never written down.',
    },
    'jonah.on_site_after_1810': {
      question: 'Was Jonah in the garden at any time after 18:10?',
      yes: 'Jonah was in the garden after 18:10.',
      no: 'Jonah was not in the garden after 18:10.',
    },
    'jonah.left_main_gate_1805': {
      question: 'Did Jonah leave by the main gate at 18:05?',
      yes: 'Jonah left by the main gate at 18:05.',
      no: 'Jonah did not leave by the main gate at 18:05.',
    },
    'jonah.carried_cool_box': {
      question: 'Was Jonah carrying a cool box that evening?',
      yes: 'Jonah was carrying a cool box.',
      no: 'Jonah carried no cool box.',
    },
    'jonah.knows_code': {
      question: 'Does Jonah know the cabinet code?',
      yes: 'Jonah knows the cabinet code.',
      no: 'Jonah does not know the cabinet code.',
    },
    'jonah.took_orchid': {
      question: 'Did Jonah take the orchid?',
      yes: 'Jonah took the orchid.',
      no: 'Jonah did not take the orchid.',
    },
    'celeste.left_1745': {
      question: 'Did Celeste leave the garden at 17:45, before closing?',
      yes: 'Celeste left the garden at 17:45.',
      no: 'Celeste did not leave at 17:45.',
    },
    'celeste.on_terrace_1830': {
      question: 'Was Celeste on the pond terrace around 18:30?',
      yes: 'Celeste was on the pond terrace around 18:30.',
      no: 'Celeste was not on the pond terrace around 18:30.',
    },
    'case.cabinet_forced': {
      question: 'Was the climate cabinet forced open?',
      yes: 'The cabinet was forced open.',
      no: 'The cabinet was opened with the right code, not forced.',
    },
  },

  evidence: {
    keypad_log: {
      title: 'Cabinet keypad',
      text: 'Right code entered at 18:22. No damage to the door or the seal.',
      holder: null,
      facts: [c('case', 'cabinet_forced', 'no')],
    },
    gate_log: {
      title: 'Staff gate log',
      text: '18:15 in, volunteer card J. PELL. 18:30 out, same card. No main gate exit on that card.',
      holder: 'mira',
      handOverWhen: 'the detective asks about the gates, cards, or who came in after closing',
      facts: [c('jonah', 'on_site_after_1810', 'yes'), c('jonah', 'left_main_gate_1805', 'no')],
    },
    car_park_ticket: {
      title: 'Car park exit ticket',
      text: 'Visitor car park, exit 18:52. Season pass: C. ARDEN.',
      holder: 'jonah',
      handOverWhen: 'the detective asks about other visitors or who else was around',
      facts: [c('celeste', 'left_1745', 'no')],
    },
    office_phone: {
      title: 'Office phone record',
      text: 'Greenhouse office extension: one call, 18:09 to 18:41.',
      holder: 'celeste',
      handOverWhen: 'the detective asks about the gardener or the office',
      facts: [c('mira', 'in_greenhouse_1810_1840', 'no')],
    },
  },

  suspects: {
    mira: {
      name: 'Mira Holt',
      role: 'Head gardener',
      bio: 'Runs the glasshouses. Says she was in Greenhouse 3 until closing and nobody else knows the code.',
      suggestions: [
        'Where were you between 18:00 and 19:00?',
        'Who came in after closing?',
        'Who knows the cabinet code?',
        'Was the cabinet forced?',
      ],
      truth: [
        'From 18:10 to 18:40 you were in the office on a long phone call with a supplier, not in Greenhouse 3.',
        'You keep the cabinet code on a note under the potting bench because you forget it. Volunteers who help with watering may have seen it.',
        'You did not see who opened the cabinet.',
        'You say it must have been forced because you cannot face that your note gave the code away.',
      ],
      story: 'You were in Greenhouse 3 the whole hour, nobody came in, and nobody but you knows the code.',
      crackOn: ['office_phone'],
      crackAdmit: 'You admit the phone call in the office from 18:10 to 18:40, and that the code was on a note under the potting bench.',
      neverAdmit: [],
      holdLine: "I've told you everything. I look after those plants like my own.",
    },
    jonah: {
      name: 'Jonah Pell',
      role: 'Volunteer guide',
      bio: 'Leads the weekend tours. Says he caught the 18:10 bus after the last tour.',
      suggestions: [
        'Where did you go after the last tour?',
        'Were you carrying anything tonight?',
        'Do you know the cabinet code?',
        'Who else was around tonight?',
      ],
      truth: [
        'After the last tour at 18:00 you went out, then came back through the staff gate at 18:15 on your volunteer card.',
        'You learned the code from the note under the potting bench while watering last month.',
        'At 18:22 you opened the cabinet, put the orchid in a blue cool box and left by the staff gate at 18:30. A collector offered you money for it.',
      ],
      story: 'You left by the main gate at 18:05 and caught the 18:10 bus home. You carried nothing but your jacket and you do not know the code.',
      crackOn: ['gate_log'],
      crackAdmit: 'You admit only that you came back at 18:15 "for your jacket" and left at 18:30. You keep denying the cool box, the code and the orchid.',
      neverAdmit: [c('jonah', 'took_orchid', 'yes')],
      holdLine: "I didn't take any orchid. I give my weekends to this place.",
    },
    celeste: {
      name: 'Celeste Arden',
      role: 'Orchid grower',
      bio: 'A rival grower with a season pass. Says she left at 17:45, before closing.',
      suggestions: [
        'When did you leave the garden?',
        'Did you stay after closing?',
        'Why did you want the orchid?',
        'What do you know about the gardener?',
      ],
      truth: [
        'You stayed after closing, sketching on the pond terrace until about 18:45, which is not allowed.',
        'At about 18:30 you saw the volunteer guide walk to the staff gate carrying a blue cool box.',
        'Last year you asked to buy a cutting of the orchid and were refused, so you fear being blamed.',
        'Through the office window you saw the head gardener on the phone for a long time.',
      ],
      story: 'You left at 17:45, before closing, and drove home.',
      crackOn: ['car_park_ticket'],
      crackAdmit: 'You admit you stayed on the pond terrace until about 18:45, and that you saw the volunteer guide carry a blue cool box to the staff gate at about 18:30.',
      neverAdmit: [],
      holdLine: "I've said what I saw. I wanted a cutting, not trouble.",
    },
  },

  mock: {
    mira: {
      intents: [
        { when: /\b(gates?|cards?|log|turnstile|who (came|got|went) in|after closing|entr(y|ies|ance))\b/i,
          reply: "The gates log every card. Here's tonight's staff gate log.",
          reveals: ['gate_log'] },
        { when: /\b(codes?|pin|note|written|sticky|password)\b/i,
          reply: "Nobody but me knows the code. I've never written it down.",
          claims: [c('mira', 'code_written_down', 'no')],
          after: {
            reply: 'It was on a note under the potting bench. Anyone watering could have seen it.',
            claims: [c('mira', 'code_written_down', 'yes')] } },
        { when: /\b(jonah|volunteer|guide|tours?|pell)\b/i,
          reply: 'Jonah ran the last tour and went for his bus. He waters for me on Sundays.' },
        { when: /\b(celeste|grower|visitors?|arden|season pass)\b/i,
          reply: 'Ms Arden? She is here every week. She wanted a cutting once.' },
        { when: /\b(phone|office|calls?|supplier)\b/i,
          reply: "The office? I wasn't in the office. I was with the plants.",
          claims: [c('mira', 'in_greenhouse_1810_1840', 'yes')],
          after: {
            reply: 'I was on the phone in the office from ten past six to twenty to seven.',
            claims: [c('mira', 'in_greenhouse_1810_1840', 'no')] } },
        { when: /\b(where|hour|evening|greenhouse|between|whole|all (night|evening))\b/i,
          reply: 'I was in Greenhouse 3 the whole hour, misting the orchids.',
          claims: [c('mira', 'in_greenhouse_1810_1840', 'yes')],
          after: {
            reply: 'From ten past six I was in the office on the phone. Back at twenty to seven.',
            claims: [c('mira', 'in_greenhouse_1810_1840', 'no')] } },
        { when: /\b(forc\w*|broke|broken|pried|smash\w*|cabinet|orchid|stolen|theft)\b/i,
          reply: 'It must have been forced. Nobody else could open it.',
          claims: [c('case', 'cabinet_forced', 'yes')] },
      ],
      fallback: {
        reply: 'I was with my plants all evening.',
        claims: [c('mira', 'in_greenhouse_1810_1840', 'yes')],
        after: { reply: "That's all. The phone call, and the note under the bench." },
      },
      present: {
        office_phone: {
          crack: true,
          reply: "All right. I was on the phone in the office from 18:10 to 18:40. And the code is on a note under the potting bench. I forget it otherwise.",
          claims: [c('mira', 'in_greenhouse_1810_1840', 'no'), c('mira', 'code_written_down', 'yes')],
        },
        gate_log: { reply: "Jonah's card at 18:15? He told me he was off to his bus." },
        car_park_ticket: { reply: 'So Ms Arden stayed. She always lingers by the pond.' },
        keypad_log: {
          reply: 'The right code? Then someone knew it.',
          claims: [c('case', 'cabinet_forced', 'no')] },
      },
      presentOther: { reply: "I don't know what that is." },
      repeatCrack: { reply: "I've told you. The phone call, and the note." },
    },

    jonah: {
      intents: [
        { when: /\b(carr\w*|bags?|box(es)?|cool ?box|cooler|holding|anything)\b/i,
          reply: "Just my jacket. I don't even own a cool box.",
          claims: [c('jonah', 'carried_cool_box', 'no')] },
        { when: /\b(codes?|pin|note|keypad)\b/i,
          reply: 'The code? Only Mira has it.',
          claims: [c('jonah', 'knows_code', 'no')] },
        { when: /\b(who else|anyone else|someone else|others?|visitors?|celeste|grower|arden|car ?park)\b/i,
          reply: 'Ask the orchid grower. Her car was still in the car park when I passed. I found this ticket by the barrier.',
          reveals: ['car_park_ticket'] },
        { when: /\b(mira|gardener|office)\b/i,
          reply: "Mira's always on the phone with suppliers." },
        { when: /\b(money|collectors?|sell|debts?|owe|pay)\b/i,
          reply: "What collector? I don't know any collectors." },
        { when: /\b(took|take|steal|stole|thief|orchid|cabinet|touch\w*)\b/i,
          reply: "I didn't touch it. I love that plant.",
          claims: [c('jonah', 'took_orchid', 'no')] },
        { when: /\b(where|after|left|leave|bus|tours?|back|return\w*|gates?|home|evening)\b/i,
          reply: 'I left by the main gate at five past six and caught the 18:10 bus.',
          claims: [c('jonah', 'on_site_after_1810', 'no'), c('jonah', 'left_main_gate_1805', 'yes')],
          after: {
            reply: 'I came back at 18:15 for my jacket. I was gone by half past.',
            claims: [c('jonah', 'on_site_after_1810', 'yes'), c('jonah', 'left_main_gate_1805', 'no')] } },
      ],
      fallback: {
        reply: "I went home after the last tour. I don't know anything.",
        claims: [c('jonah', 'on_site_after_1810', 'no')],
        after: {
          reply: "I came back for my jacket. That's all.",
          claims: [c('jonah', 'on_site_after_1810', 'yes')] },
      },
      present: {
        gate_log: {
          crack: true,
          reply: 'Fine. I came back at 18:15 for my jacket and I was out by 18:30. I never went near that cabinet.',
          claims: [
            c('jonah', 'on_site_after_1810', 'yes'),
            c('jonah', 'left_main_gate_1805', 'no'),
            c('jonah', 'took_orchid', 'no'),
          ],
        },
        office_phone: { reply: "So Mira wasn't even in the greenhouse." },
        car_park_ticket: { reply: 'See? She was still here.' },
        keypad_log: { reply: 'Plenty of volunteers have watered in there.' },
      },
      presentOther: { reply: 'That means nothing to me.' },
      repeatCrack: { reply: 'I told you, I came back for my jacket. That was all.' },
    },

    celeste: {
      intents: [
        { when: /\b(gardener|mira|office|phone)\b/i,
          reply: 'Ask for the office phone record. Through the window I could see her on the phone for ages.',
          reveals: ['office_phone'] },
        { when: /\b(jonah|volunteer|guide|cool ?box|staff gate|carry\w*)\b/i,
          reply: "I didn't see anyone. I'd left by then.",
          claims: [c('celeste', 'left_1745', 'yes')],
          after: {
            reply: 'The volunteer guide walked to the staff gate around 18:30 with a blue cool box.',
            claims: [c('jonah', 'carried_cool_box', 'yes')] } },
        { when: /\b(terrace|pond|sketch\w*|stay\w*|after closing|draw\w*)\b/i,
          reply: 'Stay after closing? No, I left at quarter to six.',
          claims: [c('celeste', 'left_1745', 'yes'), c('celeste', 'on_terrace_1830', 'no')],
          after: {
            reply: 'I stayed sketching on the pond terrace until about 18:45.',
            claims: [c('celeste', 'left_1745', 'no'), c('celeste', 'on_terrace_1830', 'yes')] } },
        { when: /\b(orchid|cuttings?|buy|bought|want\w*|price|offer\w*)\b/i,
          reply: "I asked for a cutting last year. They said no. That's all." },
        { when: /\b(where|leave|left|when|drive|drove|home|time|evening)\b/i,
          reply: 'I left at 17:45, before closing, and drove home.',
          claims: [c('celeste', 'left_1745', 'yes'), c('celeste', 'on_terrace_1830', 'no')],
          after: {
            reply: 'I stayed until about 18:45. I should have said so.',
            claims: [c('celeste', 'left_1745', 'no'), c('celeste', 'on_terrace_1830', 'yes')] } },
      ],
      fallback: {
        reply: "I left before closing. I don't know anything else.",
        claims: [c('celeste', 'left_1745', 'yes')],
        after: {
          reply: "I've told you what I saw: the guide and his cool box.",
          claims: [c('jonah', 'carried_cool_box', 'yes')] },
      },
      present: {
        car_park_ticket: {
          crack: true,
          reply: 'Yes, all right. I stayed sketching on the pond terrace until about 18:45. Around 18:30 I saw the volunteer guide carry a blue cool box to the staff gate.',
          claims: [
            c('celeste', 'left_1745', 'no'),
            c('celeste', 'on_terrace_1830', 'yes'),
            c('jonah', 'carried_cool_box', 'yes'),
          ],
        },
        gate_log: { reply: "So he came back. With that cool box, I'd bet." },
        office_phone: { reply: 'I told you she was on the phone.' },
        keypad_log: { reply: 'The right code. Then it was someone they trusted.' },
      },
      presentOther: { reply: "I've never seen that before." },
      repeatCrack: { reply: "I've told you. The terrace, and the guide with his cool box." },
    },
  },
};
