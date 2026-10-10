// The Harbor Compass: the first case. Server only. Nothing in this file is sent to the
// browser except what publicCase() in ./index.js picks out.

const c = (about, slot, value) => ({ about, slot, value });

export const harborCompass = {
  id: 'harbor-compass',
  title: 'The Harbor Compass',
  intro:
    'Storm night at the Harbor Museum. Between 21:00 and 22:00 someone opened the East ' +
    'Gallery display case and took the 1852 brass compass. Three people were around. ' +
    'Find out who is lying, then make your accusation.',
  questionBudget: 24,
  startEvidence: ['case_lock'],
  culprit: 'theo',
  solution:
    'Theo came back through the side door at 21:15 with his own badge, opened the case ' +
    'with his restorer key while Rosa was outside on a smoke break, and drove off in his ' +
    'van at 21:44 with the compass. Rosa lied to hide her break. Dana lied about leaving ' +
    'at 21:00 to keep out of it, but she saw his van from the café window.',

  // Yes/no questions the model may tag claims against. Key = "<about>.<slot>".
  slots: {
    'rosa.at_desk_2120_2135': {
      question: 'Was Rosa at the front desk the whole time from 21:20 to 21:35?',
      yes: 'Rosa was at the front desk from 21:20 to 21:35.',
      no: 'Rosa was away from the front desk between 21:20 and 21:35.',
    },
    'rosa.saw_light_east_gallery': {
      question: 'Did Rosa see a light in the East Gallery that night?',
      yes: 'Rosa saw a light in the East Gallery.',
      no: 'Rosa saw nothing unusual in the East Gallery.',
    },
    'rosa.master_key_in_drawer': {
      question: "Did Rosa's master keys stay in the locked desk drawer?",
      yes: "Rosa's master keys stayed in the locked drawer.",
      no: "Rosa's master keys left the drawer.",
    },
    'theo.in_building_after_2100': {
      question: 'Was Theo inside the museum at any time after 21:00?',
      yes: 'Theo was in the museum after 21:00.',
      no: 'Theo was not in the museum after 21:00.',
    },
    'theo.van_in_lot_2120': {
      question: "Was Theo's van in the museum's back lot around 21:20?",
      yes: "Theo's van was in the back lot around 21:20.",
      no: "Theo's van was not at the museum that evening.",
    },
    'theo.has_case_key': {
      question: 'Does Theo have a key to the gallery display cases?',
      yes: 'Theo has a key to the display cases.',
      no: 'Theo has no key to the display cases.',
    },
    'theo.took_compass': {
      question: 'Did Theo take the compass?',
      yes: 'Theo took the compass.',
      no: 'Theo did not take the compass.',
    },
    'dana.left_building_2100': {
      question: 'Did Dana leave the museum at 21:00 with the lecture crowd?',
      yes: 'Dana left the museum at 21:00.',
      no: 'Dana did not leave the museum at 21:00.',
    },
    'dana.in_cafe_2130': {
      question: 'Was Dana in the museum café around 21:30?',
      yes: 'Dana was in the café around 21:30.',
      no: 'Dana was not in the café around 21:30.',
    },
    'case.case_forced': {
      question: 'Was the display case forced open?',
      yes: 'The display case was forced open.',
      no: 'The display case was opened with a key, not forced.',
    },
  },

  evidence: {
    case_lock: {
      title: 'East Gallery case',
      text: 'Opened with a key. No marks on the lock or the glass.',
      holder: null,
      facts: [c('case', 'case_forced', 'no')],
    },
    badge_log: {
      title: 'Side-door badge log',
      text: '21:15 side door, badge T. MARSH (restoration). Next exit on that badge: 21:44.',
      holder: 'rosa',
      handOverWhen: 'the detective asks about the doors, badges, or who came in',
      facts: [c('theo', 'in_building_after_2100', 'yes')],
    },
    cafe_receipt: {
      title: 'Café till receipt',
      text: 'Harbor Café, 21:32. One mint tea. Paid by card: D. OKAFOR.',
      holder: 'theo',
      handOverWhen: 'the detective asks about the café or who else was around',
      facts: [c('dana', 'in_cafe_2130', 'yes'), c('dana', 'left_building_2100', 'no')],
    },
    cctv_desk: {
      title: 'Front desk camera',
      text: 'From 21:20 to 21:35 the front desk chair is empty. The staff door opens at 21:20 and at 21:35.',
      holder: 'dana',
      handOverWhen: 'the detective asks about the guard or the front desk',
      facts: [c('rosa', 'at_desk_2120_2135', 'no')],
    },
  },

  suspects: {
    rosa: {
      name: 'Rosa Vale',
      role: 'Night guard',
      bio: 'Eleven years on nights. Says she sat at the front desk all evening.',
      suggestions: [
        'Where were you all evening?',
        'Who came in through the doors tonight?',
        'Who has keys to the display cases?',
        'Did you see anything in the East Gallery?',
      ],
      truth: [
        'You sat at the front desk all evening except 21:20 to 21:35, when you went out the staff door for a cigarette, which is against the rules.',
        'Coming back at 21:35 you saw a torch light moving in the East Gallery and told yourself it was the storm.',
        'Your master key ring stayed locked in the desk drawer. Theo, the restorer, has his own case keys.',
        'You think the case must have been forced, because you never imagined staff would do it.',
      ],
      story: 'You never left the desk, not once, and you saw nothing unusual.',
      crackOn: ['cctv_desk'],
      crackAdmit: 'You admit the smoke break from 21:20 to 21:35 and the torch light in the East Gallery at 21:35.',
      neverAdmit: [],
      holdLine: "I've told you what I know. I was on duty and I did my job.",
    },
    theo: {
      name: 'Theo Marsh',
      role: 'Instrument restorer',
      bio: 'Restores the museum’s brass instruments. Has keys to the gallery cases.',
      suggestions: [
        'Where were you after 21:00?',
        'Where was your van tonight?',
        'Do you have a key to the case?',
        'Who else was around tonight?',
      ],
      truth: [
        'You left at 20:30, then came back through the side door at 21:15 using your own badge.',
        'Your van was in the back lot from about 21:10 to 21:44.',
        'You opened the case with your restorer key and took the compass to pay a debt. You left at 21:44.',
      ],
      story: 'You left at 20:30, went straight home and watched the match. Your van was outside your flat all night. You never touched the compass.',
      crackOn: ['badge_log'],
      crackAdmit: 'You admit only that you came back at 21:15 "for your phone" and were in and out in five minutes. You keep denying the van and the compass.',
      neverAdmit: [c('theo', 'took_compass', 'yes')],
      holdLine: "I didn't take it. I'm not saying another word about that compass without a lawyer.",
    },
    dana: {
      name: 'Dana Okafor',
      role: 'Visiting collector',
      bio: 'Came for the 19:30 lecture. Says she left with the crowd at 21:00.',
      suggestions: [
        'When did you leave the museum?',
        'Did you go to the café after the lecture?',
        'Why did you want the compass?',
        'What did you notice about the guard?',
      ],
      truth: [
        'After the lecture you waited in the museum café until about 21:40 for the rain to ease.',
        "From the café window you saw the restorer's van in the back lot at about 21:20.",
        'Last spring you offered to buy the compass and argued about the price, so you are afraid of being suspected.',
        'The café staff told you the guard takes long smoke breaks.',
      ],
      story: 'You left with the lecture crowd at 21:00 and took a taxi to your hotel.',
      crackOn: ['cafe_receipt'],
      crackAdmit: "You admit you stayed in the café until about 21:40, and that you saw the restorer's van in the back lot around 21:20.",
      neverAdmit: [],
      holdLine: "I've said what I saw. I want nothing to do with that compass.",
    },
  },

  // Scripted answers for the mock model. Each intent: a pattern on the question, the
  // reply before and after the suspect changes their story, the claims made, and any
  // evidence handed over. First match wins.
  mock: {
    rosa: {
      intents: [
        { when: /\b(doors?|badges?|swipe|card|log|who (came|got|went) in|entr(y|ies|ance))\b/i,
          reply: "Every staff door logs badges. Here, I printed tonight's side-door log for you.",
          reveals: ['badge_log'] },
        { when: /\b(cameras?|cctv|video|footage)\b/i,
          reply: "The cameras record to the office upstairs. I wouldn't know how to pull them." },
        { when: /\b(keys?|master|drawer)\b/i,
          reply: 'My master ring stays locked in the desk drawer. The restorer has his own case keys.',
          claims: [c('rosa', 'master_key_in_drawer', 'yes'), c('theo', 'has_case_key', 'yes')] },
        { when: /\b(theo|restorer|marsh)\b/i,
          reply: 'Theo? He signed out around half eight. Good lad, always fixing something.' },
        { when: /\b(dana|collector|okafor|lecture|caf[eé])\b/i,
          reply: 'The collector came for the lecture. The café stays open till ten on lecture nights.' },
        { when: /\b(light|torch|gallery|saw|see|seen|notice|unusual|strange|hear|heard)\b/i,
          reply: "Nothing unusual. Rain on the skylights, that's all.",
          claims: [c('rosa', 'saw_light_east_gallery', 'no')],
          after: {
            reply: 'That torch light in the East Gallery, around 21:35. I should have gone to look.',
            claims: [c('rosa', 'saw_light_east_gallery', 'yes')] } },
        { when: /\b(smok\w*|cigarettes?|break|outside|step(ped)?|leave|left|where|desk|all (night|evening)|evening|whole)\b/i,
          reply: 'I never left the desk. Not once, all evening.',
          claims: [c('rosa', 'at_desk_2120_2135', 'yes')],
          after: {
            reply: 'Fifteen minutes outside the staff door, 21:20 to 21:35. That was all.',
            claims: [c('rosa', 'at_desk_2120_2135', 'no')] } },
        { when: /\b(forc\w*|broke|broken|pried|smash\w*|lock|case|compass|display|stolen|theft)\b/i,
          reply: 'Must have been forced. In a storm like that nobody hears a thing.',
          claims: [c('case', 'case_forced', 'yes')] },
      ],
      fallback: {
        reply: "I've told the officers already. I was at my desk.",
        claims: [c('rosa', 'at_desk_2120_2135', 'yes')],
        after: { reply: "That's everything. Fifteen minutes outside, and that light in the gallery." },
      },
      present: {
        cctv_desk: {
          crack: true,
          reply: 'Alright. I stepped out the staff door for a smoke, 21:20 to 21:35. When I came back I saw a torch light moving in the East Gallery. I told myself it was the storm.',
          claims: [c('rosa', 'at_desk_2120_2135', 'no'), c('rosa', 'saw_light_east_gallery', 'yes')],
        },
        badge_log: { reply: "That's the side door. Theo's badge at 21:15? He told me he was going home." },
        cafe_receipt: { reply: "The café's not my patch. If she was there, she was there." },
        case_lock: {
          reply: "Opened with a key? Then it wasn't some kid off the street.",
          claims: [c('case', 'case_forced', 'no')] },
      },
      presentOther: { reply: "I don't know what that is." },
      repeatCrack: { reply: "I've already told you. I was outside for fifteen minutes." },
    },

    theo: {
      intents: [
        { when: /\b(vans?|cars?|drive|drove|park\w*|lot|vehicle)\b/i,
          reply: 'My van was parked outside my flat all night.',
          claims: [c('theo', 'van_in_lot_2120', 'no')],
          after: {
            reply: 'I walked over from the tram stop. The van stayed at home.',
            claims: [c('theo', 'van_in_lot_2120', 'no')] } },
        { when: /\b(keys?)\b/i,
          reply: 'Of course I have a case key. I restore half the instruments in that room.',
          claims: [c('theo', 'has_case_key', 'yes')] },
        { when: /\b(caf[eé]|who else|anyone else|someone else|dana|collector|okafor|others?)\b/i,
          reply: 'Ask the collector. She hangs around the café after every lecture. Check the café till if you don\'t believe me.',
          reveals: ['cafe_receipt'] },
        { when: /\b(rosa|guard|desk)\b/i,
          reply: "Rosa's a good guard. Likes her smoke breaks, mind." },
        { when: /\b(money|debts?|owe|loan|pay|bills?)\b/i,
          reply: 'My money is my business.' },
        { when: /\b(took|take|steal|stole|thief|compass|case|display|touch\w*)\b/i,
          reply: "I didn't touch it. I'd lose my job, and I love those instruments.",
          claims: [c('theo', 'took_compass', 'no')] },
        { when: /\b(where|home|leave|left|when|night|evening|after|back|return\w*|match)\b/i,
          reply: 'I left at half eight and went straight home. Watched the match.',
          claims: [c('theo', 'in_building_after_2100', 'no')],
          after: {
            reply: 'I came back at 21:15 for my phone. In and out, five minutes.',
            claims: [c('theo', 'in_building_after_2100', 'yes')] } },
      ],
      fallback: {
        reply: "Look, I went home at half eight. I don't know anything.",
        claims: [c('theo', 'in_building_after_2100', 'no')],
        after: {
          reply: "I've told you. I came back for my phone. That's all.",
          claims: [c('theo', 'in_building_after_2100', 'yes')] },
      },
      present: {
        badge_log: {
          crack: true,
          reply: 'Fine. I came back at 21:15 for my phone. In and out. I never went near the gallery.',
          claims: [c('theo', 'in_building_after_2100', 'yes'), c('theo', 'took_compass', 'no')],
        },
        cctv_desk: { reply: "So the guard wasn't at her desk. Anyone could have walked in." },
        cafe_receipt: { reply: 'See? She was here long after she says she left.' },
        case_lock: { reply: 'Plenty of people know where the spare keys hang.' },
      },
      presentOther: { reply: 'That means nothing to me.' },
      repeatCrack: { reply: 'I told you, I came back for my phone. That was all.' },
    },

    dana: {
      intents: [
        { when: /\b(guard|desk|rosa|cameras?|cctv)\b/i,
          reply: 'Ask for the front desk camera. The café staff say the guard takes long smoke breaks.',
          reveals: ['cctv_desk'] },
        { when: /\b(vans?|cars?|lot|park\w*|vehicle|theo|restorer|marsh)\b/i,
          reply: "I didn't see anyone's van. I left at nine.",
          claims: [c('dana', 'left_building_2100', 'yes')],
          after: {
            reply: "The restorer's van was in the back lot around 21:20. I saw it from the café window.",
            claims: [c('theo', 'van_in_lot_2120', 'yes')] } },
        { when: /\b(caf[eé]|tea|coffee|drink|wait\w*|rain|stay\w*)\b/i,
          reply: 'The café? No. I went straight out to a taxi.',
          claims: [c('dana', 'in_cafe_2130', 'no'), c('dana', 'left_building_2100', 'yes')],
          after: {
            reply: 'I waited in the café until about 21:40 for the rain to ease.',
            claims: [c('dana', 'in_cafe_2130', 'yes'), c('dana', 'left_building_2100', 'no')] } },
        { when: /\b(compass|buy|bought|offer\w*|price|argu\w*|want\w*|collect\w*)\b/i,
          reply: "I offered to buy it last spring. They said no. That's the whole story." },
        { when: /\b(where|leave|left|when|taxi|hotel|night|lecture|after|time)\b/i,
          reply: 'I left with the lecture crowd at nine and took a taxi to my hotel.',
          claims: [c('dana', 'left_building_2100', 'yes'), c('dana', 'in_cafe_2130', 'no')],
          after: {
            reply: 'I stayed in the café until about 21:40. I should have said so.',
            claims: [c('dana', 'left_building_2100', 'no'), c('dana', 'in_cafe_2130', 'yes')] } },
      ],
      fallback: {
        reply: "I was at the lecture, then I left at nine. I don't know anything else.",
        claims: [c('dana', 'left_building_2100', 'yes')],
        after: {
          reply: "I've told you what I saw: his van, in the back lot.",
          claims: [c('theo', 'van_in_lot_2120', 'yes')] },
      },
      present: {
        cafe_receipt: {
          crack: true,
          reply: "Yes. I waited in the café until about 21:40 for the rain to ease. From the window I saw the restorer's van in the back lot, around 21:20.",
          claims: [
            c('dana', 'left_building_2100', 'no'),
            c('dana', 'in_cafe_2130', 'yes'),
            c('theo', 'van_in_lot_2120', 'yes'),
          ],
        },
        badge_log: { reply: "So he came back. I can't say I'm surprised." },
        cctv_desk: { reply: "I told you the guard wasn't at her desk." },
        case_lock: { reply: 'A key. Then it was someone from inside.' },
      },
      presentOther: { reply: "I've never seen that before." },
      repeatCrack: { reply: "I've told you. The café, the rain, his van." },
    },
  },
};
