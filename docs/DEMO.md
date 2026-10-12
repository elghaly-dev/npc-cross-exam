# Demo video script (under 3 minutes)

Recorded on a phone with the screen recorder, portrait. Target length 2:40.

**Before the final recording:** the header pill must read **Nemotron**, not **Mock model**.
The mock is for rehearsing the shots; the submitted video shows the real model. Until the
Nebius key is set (`wrangler secret put NEBIUS_API_KEY`), rehearse on `npm start`.

The suspects' lines differ from run to run on the real model. The shots below are the
same either way: the questions, the evidence and the contradictions come from the case
file and the detector, not from the model.

## Before you record

- Clear the site data for the game (or use a private tab) so every case shows "New case".
- Do Not Disturb on. No notifications, names or accounts on screen.
- Case: **The Greenhouse Orchid**. It is the one rehearsed below.

## Shot list and voiceover

| Time | Shot | Voiceover |
| --- | --- | --- |
| 0:00–0:12 | The case picker: three cases, three suspects each. | "NPC Cross-Exam is a detective game for your phone. Every suspect is played by NVIDIA Nemotron, and every one of them is hiding something." |
| 0:12–0:25 | Tap **The Greenhouse Orchid**. The intro and the three suspect tabs. | "A rare orchid was taken from a locked cabinet at closing time. Three people were still in the garden. I have 24 questions." |
| 0:25–0:45 | Mira's tab. Tap "Was the cabinet forced?". She says it must have been forced. A **Story vs evidence** card appears: the keypad shows the right code. | "The head gardener says the cabinet was forced. The keypad says the right code was used. The game catches that, not the model: Nemotron tags what each suspect claims, and plain code compares the claims." |
| 0:45–1:00 | Tap "Who came in after closing?". She hands over the **Staff gate log**. | "Suspects hand over evidence when you ask the right question." |
| 1:00–1:20 | Jonah's tab. Tap "Where did you go after the last tour?": he left at 18:05, and two contradiction cards appear against the gate log. Then "Were you carrying anything tonight?": just his jacket. | "The volunteer guide says he caught the bus at ten past six. His own card came back through the staff gate at 18:15. And he says he carried nothing." |
| 1:20–1:45 | Tap **Evidence**, **Show to Jonah** on the gate log, and ask "This says otherwise. What really happened?". He changes his story, but only partly. Then "Who else was around tonight?": he hands over the **Car park exit ticket**. | "Show him the log and he changes his story: back for his jacket, in and out. He still denies the orchid. The culprit never confesses; you have to prove it." |
| 1:45–2:10 | Celeste's tab. "When did you leave the garden?", then show her the car park ticket. She admits she stayed, and that she saw Jonah with a cool box. A **Stories clash** card appears. | "The rival grower lied too, for her own reason. Once she breaks, her story clashes with his: she saw the guide carry a cool box to the staff gate." |
| 2:10–2:25 | Tap **Notebook**: the contradictions, each with a **Press** button, and the running score. | "Every contradiction is in the notebook, with a button to press the suspect on it." |
| 2:25–2:40 | **Accuse** → "Who took the orchid?" → Jonah → result screen with the grade and the true story. | "Accuse, and the game scores the case by how many contradictions back you up. Three cases, one engine, and the API key never leaves the server." |

## If something goes wrong while recording

- A suspect answers off-script on the real model: keep going. Ask the same suggested
  question again or show the evidence; the detector only counts what the suspect claims.
- "Too many questions too fast": wait ten seconds. The proxy limits each visitor.
- Do not show the browser's address bar with a preview or local URL in the final cut.

## Do not show or say

- Any number that is not on screen or in `docs/EVAL.md`.
- A real person's name, a city, or an account.
