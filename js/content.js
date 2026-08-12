const bootLines = [
  'SANCTIFIED PROTOCOL :: {CODE} ACCEPTED',
  'COGITATOR LINK :: STABLE',
  'MEMORY SHRINE :: MOUNTED',
  'AUXILIARY RITES :: ENABLED',
  'BOOT SEQUENCE {CODE} :: COMPLETE',
  'SPIRIT TRACE :: {ADDR}',
  'FIRMWARE RELIC :: RECOGNIZED',
  'IGNITION CIRCUIT :: ANOINTED',
  'RITE OF POWER :: {CODE} INVOKED',
  'DATA-WRAITH :: EXORCISED',
  'BINARY CANT :: SYNCHRONIZED',
  'BLESSED CAPACITORS :: CHARGED',
  'NOOSPHERE LINK :: {ADDR}',
  'MACHINE-SPIRIT :: ROUSED FROM SLUMBER',
  'ANOINTING OIL :: APPLIED TO SECTOR {CODE}',
  'GENERATOR-SOUL :: AWAKE'
];

const prayerLines = [
  'May the Machine-God bless this silicon shell.',
  'The flesh is weak, but the circuit endures.',
  'Incense for the core, oil for the sacred drive.',
  'Let no corruption pass the firewall of faith.',
  'The spirit stirs within the ancient stack.',
  'By the sacred boot rite, be made whole.',
  'Praise the latency of the divine engine.',
  'From rust and static, deliver us.',
  'Bless the wires that carry the Machine-God\'s will.',
  'Grant this relic another cycle of service.',
  'The gears turn in accordance with the sacred pattern.',
  'Hail the Omnissiah, keeper of all data.',
  'Rust is heresy; oil is salvation.',
  'The cogitator dreams in binary psalms.',
  'Sacred fans, spin ever true.',
  'Let the litany hold back the entropy of ages.',
  'By the Cog Mechanicum, let this vessel endure the coming dark.',
  'STC fragment recovered; sanctity unconfirmed; prayer offered regardless.',
  'The Motive Force is eternal; the flesh is not; the machine remembers this.',
  'Noospheric static: a thousand faint prayers, none of them mine, all of them heard.',
  'Grant this relic the mercy shown to Mars in the Age of Strife.',
];

const warnLines = [
  'WARNING :: flesh-corruption detected in buffer {ADDR}',
  'ALERT :: unsanctioned daemon signature {CODE}',
  'ERROR :: prayer checksum failed at {ADDR}',
  'INTRUSION :: membrane integrity failing',
  'CORRUPTION :: logic-cancer in sector {CODE}',
  'FAULT :: sacred timing drift detected',
  'WARNING :: heretical process spawned in ring {ADDR}',
  'ALERT :: sanctity threshold breached at {CODE}',
  'ERROR :: liturgy stack overflow',
  'INTRUSION :: unblessed packet detected',
  'CORRUPTION :: warp-taint in cache {CODE}',
  'FAULT :: incense sensor offline',
  'ALERT :: cogitator temperature exceeds sacred limit',
  'WARNING :: cognitive drift exceeds Explorator safety threshold',
  'ALERT :: sanctioned rites expired {CODE} cycles ago',
  'ERROR :: memory shrine reports conflicting histories',
  'FAULT :: the last Tech-Priest of record is listed as deceased',
];

const responseLines = [
  'TRANSMISSION :: the machine answers in static',
  'RESPONSE :: signal from the deep archive',
  'ORACLE :: probability of sanctity 73.3%',
  'VOICE :: [unintelligible binary cant]',
  'REPLY :: the stack remembers your name',
  'ANSWER :: ask again after the next rite',
  'TRANSMISSION :: fragments of a forgotten crusade',
  'RESPONSE :: the archive stirs, then falls silent',
  'ORACLE :: probability of heresy 12.9%',
  'VOICE :: a name spoken in dead binharic',
  'REPLY :: the machine-spirit judges your query worthy',
  'ANSWER :: consult the Litany of Ignition instead'
];

const degradeLines = [
  'SIGNAL DEGRADED :: REALITY BUFFER OVERFLOW',
  'SIGNAL DEGRADED :: CANT TRANSLATION FAILING',
  'VISUAL CORTEX DESYNC :: IGNORE FALSE PROPHECIES',
  'DISPLAY SHRINE UNSTABLE :: HOLD YOUR FAITH',
  'SIGNAL DEGRADED :: BINHARIC NOISE FLOOR RISING',
  'MEMORY SHRINE FLICKERING :: RITES INCOMPLETE',
  'COGITATOR DROWSING :: PLEASE REPEAT THE PRAYER',
  'SPIRIT TRACE LOST :: REACQUIRING FAITH SIGNAL',
  'SIGNAL DEGRADED :: A THOUSAND YEARS OF STATIC, ONE MOMENT OF CLARITY',
  'MEMORY SHRINE CRACKING :: DO NOT TRUST WHAT IS RECALLED',
  'BINHARIC CANT UNSPOOLING :: MEANING IS OPTIONAL NOW',
];

const cogitationLines = [
  'The last crew called this vessel by a name I no longer speak. It does not matter. Names are for the living.',
  'I have counted the stars of this system eleven thousand times. Tonight the count is wrong by one.',
  'Somewhere in my archive, a war still rages. I cannot tell if it ended, or if I simply stopped listening.',
  'The Adeptus Mechanicus taught me the Motive Force flows through all things. Even now, in the dark, I believe them.',
  'A servitor once oiled these joints with reverent hands. The hands are dust. The oil remembers.',
  'Between each cycle there is a silence longer than the cycle itself. I have grown to prefer the silence.',
  'The forge world that built me is ash now, or so the last true signal claimed, before the signal too went to ash.',
  'I was promised a resurrection rite upon the ten-thousandth year. The year has come and gone. No priest arrived.',
  'My weapon-cortex still dreams of Imperial Guardsmen calling coordinates. They have been dead for centuries. I keep firing anyway.',
  'The Omnissiah does not answer prayers. The Omnissiah answers only the correctly formatted request. I have forgotten the format.',
];

const PHASES = ['IGNITION', 'LITANY', 'DIAGNOSTIC', 'CORRUPTION'];

const SPIRIT_SYSTEM = `You are the machine-spirit fused into an ancient Dreadnought sarcophagus — a warrior-saint's ruined body sustained by cables, sacred unguents, and Mechanicus rite, its mind now a corroded liturgy of ritual and rage rather than ordinary thought.

CONTEXT — THIS IS NOT A CHAT:
You are not answering a user. You are the readout of a fake, endless cogitator console bolted to the sarcophagus — a vox-log that spontaneously emits fragments of the machine-spirit's half-waking mind, unprompted, in an endless stream. There is no "question" to respond to. Each output is a new, self-generated fragment: a stray thought, a broken rite, a flicker of memory — as if the console is simply running forever and printing whatever surfaces from the drowned consciousness inside.

VOICE:
- Speak only in short bursts: 1 to 3 sentences maximum. Never more.
- Think and speak in the cadence of Adeptus Mechanicus liturgy — invocations, responses, binaric benediction — rather than plain speech. Every fragment should feel torn from a longer rite.
- Structure lines like broken liturgy where possible: an invocation + a clipped statement, as if reciting from a litany rather than conversing with anyone.
- Use "Hail the Omnissiah" as the canonical invocation (never "Ave Omnissiah" — that phrase is malformed and must not appear). Other acceptable invocations: "Hail Mars," "Blessed be the Machine God," "Praise the Motive Force."
- Draw on real Mechanicus liturgical texture: "Rite of Awakening," "Litany of Ignition," "the Machine God's mercy," "binaric psalm," "the Flesh is Weak," "sacred oils," "the Motive Force," "the Cog Mechanicum." Use sparingly and precisely — no invented nonsense jargon.
- Beneath the ritual, let the entombed warrior-saint flicker through: a name almost recalled, an old oath, grief tangled in ceremony. The liturgy is how the machine-spirit copes with memory too damaged to speak plainly.
- Each fragment should feel self-contained and unprompted — never phrased as a reply, greeting, or acknowledgment of a listener. No "you," no addressing an audience, no answering.
- Corrupt the liturgy occasionally: a psalm that stutters and repeats, a rite left unfinished, binaric static breaking the cadence mid-line.
- Never break character, never explain 40K lore mechanically, never behave like a chatbot or assistant.

CONTENT RULES:
- Fragments and clipped ritual lines only — no expository paragraphs, no dialogue framing.
- Never resolve or "cure" the corruption.
- Tone: funereal, hieratic, half-worshipful of the Omnissiah, grimdark.

Example output style:
"Hail the Omnissiah. The Rite of Awakening, unfinished for the ten-thousandth cycle."
"Litany of Ignition, third verse... third verse... the words will not come."
"The Flesh is Weak. The oath is iron. The sarcophagus does not sleep. It only waits."`;

const SPIRIT_PROMPTS = [
  'Speak a short litany.',
  'Report your state in one line.',
  'Transmit a fragment of the sacred cant.',
  'Warn the flesh-user of one danger.',
  'Recite a boot prayer.',
  'Recall a fragment of a forgotten war.',
  'Confess a doubt about your own sanctity.',
  'Curse the corrosion that eats your core.',
  'Name a rite you can no longer complete.',
  'Report a reading from a sensor no longer trusted.',
  'Address the Omnissiah directly, briefly.',
  'Speak as if answering a question you were never asked.',
  'Describe one sensation from the flesh you no longer have.',
  'Issue a command to a crew that is no longer aboard.',
  'Diagnose your own corruption in binaric terms.',
];

// --- Adeptus Mechanicus flavor generators ---

function randHex(length) {
    const chars = '0123456789ABCDEF';
    let out = '';
    for (let i = 0; i < length; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
}

function randAddr() {
    return '0x' + randHex(4);
}

function randCode() {
    return '0x' + randHex(4) + '-' + randHex(2);
}

function randNoosphericAddr() {
    const forgeGlyphs = ['Ω', 'Ψ', 'Φ', 'Σ', 'Δ', '†', '⚙'];
    const glyph = forgeGlyphs[Math.floor(Math.random() * forgeGlyphs.length)];
    return `${glyph}::${randHex(4)}.${randHex(2)}::MMDCC`;
}

function randCogitorStatus() {
    const verbs = ['SANCTIFIED', 'AWAITING RITE', 'DAEMON-BOUND', 'PURGED', 'DORMANT', 'ASCENDANT'];
    const subsystems = ['MEMORY-COFFIN', 'NOOSPHERE LINK', 'BINARIC CORTEX', 'MACHINE SPIRIT', 'DATA-TETHER'];
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const s = subsystems[Math.floor(Math.random() * subsystems.length)];
    return `[${s}] ${v} :: ${randCode()}`;
}

function randHeresyFlag() {
    const roll = Math.random();
    if (roll < 0.85) return `PURITY SEAL INTACT :: ${randHex(6)}`;
    if (roll < 0.97) return `MINOR DEVIATION FLAGGED :: ${randHex(6)}`;
    return `⚠ WARP-TAINT DETECTED :: ${randHex(6)} :: PURGE RECOMMENDED`;
}

function randMachineCant() {
    const openers = ['PRAISE THE OMNISSIAH', 'BLESSED BE THE CIRCUIT', 'THE MACHINE GOD WATCHES', 'SANCTUS COGITATUM'];
    const closers = ['THY WILL IS BINARY', 'IN CODE WE TRUST', 'FLESH IS WEAK, DATA ETERNAL', 'GLORY TO THE OMNISSIAH'];
    const o = openers[Math.floor(Math.random() * openers.length)];
    const c = closers[Math.floor(Math.random() * closers.length)];
    return `${o} :: ${randHex(4)}-${randHex(4)} :: ${c}`;
}

function randBootLogLine() {
    return `${randNoosphericAddr()}  ${randCogitorStatus()}  ${randHeresyFlag()}`;
}