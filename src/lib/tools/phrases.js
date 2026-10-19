/**
 * Paket L «Werkzeugkasten» (#317 Wichtige Sätze offline, Noah 19.10.2026: only a fixed list, 0 Kosten).
 * Each sentence: an English key for t() (the line in the app's language) and its fixed translations.
 * The translations are data, never through t(). Pure, tested in tests/werkzeugkasten.test.js.
 */
export const PHRASE_LANGS = [
  { key: 'fr', name: 'Français', speak: 'fr-FR' },
  { key: 'it', name: 'Italiano', speak: 'it-IT' },
  { key: 'en', name: 'English', speak: 'en-GB' },
  { key: 'es', name: 'Español', speak: 'es-ES' },
  { key: 'pt', name: 'Português', speak: 'pt-PT' },
  { key: 'nl', name: 'Nederlands', speak: 'nl-NL' },
];

export const PHRASE_GROUPS = [
  { key: 'basic', label: 'Basics' },
  { key: 'bike', label: 'Bike|phrases' },
  { key: 'sleep', label: 'Sleep and eat' },
  { key: 'help', label: 'Help|phrases' },
];

export const PHRASES = [
  { g: 'basic', en: 'Hello', fr: 'Bonjour', it: 'Buongiorno' , es: 'Hola', pt: 'Olá', nl: 'Hallo' },
  { g: 'basic', en: 'Thank you very much', fr: 'Merci beaucoup', it: 'Grazie mille' , es: 'Muchas gracias', pt: 'Muito obrigado', nl: 'Hartelijk dank' },
  { g: 'basic', en: 'Excuse me', fr: 'Excusez-moi', it: 'Mi scusi' , es: 'Perdone', pt: 'Desculpe', nl: 'Pardon' },
  { g: 'basic', en: 'Do you speak English?', fr: 'Parlez-vous anglais ?', it: 'Parla inglese?' , es: '¿Habla inglés?', pt: 'Fala inglês?', nl: 'Spreekt u Engels?' },
  { g: 'basic', en: 'I do not understand', fr: 'Je ne comprends pas', it: 'Non capisco' , es: 'No entiendo', pt: 'Não percebo', nl: 'Ik begrijp het niet' },
  { g: 'basic', en: 'How much does it cost?', fr: 'Combien ça coûte ?', it: 'Quanto costa?' , es: '¿Cuánto cuesta?', pt: 'Quanto custa?', nl: 'Hoeveel kost het?' },
  { g: 'basic', en: 'Can I pay by card?', fr: 'Je peux payer par carte ?', it: 'Posso pagare con la carta?' , es: '¿Puedo pagar con tarjeta?', pt: 'Posso pagar com cartão?', nl: 'Kan ik met de kaart betalen?' },
  { g: 'basic', en: 'Where is the toilet?', fr: 'Où sont les toilettes ?', it: 'Dov’è il bagno?' , es: '¿Dónde está el baño?', pt: 'Onde é a casa de banho?', nl: 'Waar is het toilet?' },
  { g: 'bike', en: 'Where is the next bike shop?', fr: 'Où est le prochain magasin de vélos ?', it: 'Dov’è il negozio di bici più vicino?' , es: '¿Dónde está la tienda de bicis más cercana?', pt: 'Onde fica a loja de bicicletas mais próxima?', nl: 'Waar is de dichtstbijzijnde fietsenwinkel?' },
  { g: 'bike', en: 'I have a flat tyre', fr: 'J’ai un pneu crevé', it: 'Ho una gomma bucata' , es: 'Tengo un pinchazo', pt: 'Tenho um pneu furado', nl: 'Ik heb een lekke band' },
  { g: 'bike', en: 'Do you have a pump?', fr: 'Avez-vous une pompe ?', it: 'Ha una pompa?' , es: '¿Tiene una bomba?', pt: 'Tem uma bomba?', nl: 'Heeft u een pomp?' },
  { g: 'bike', en: 'Can I leave my bike here?', fr: 'Je peux laisser mon vélo ici ?', it: 'Posso lasciare la bici qui?' , es: '¿Puedo dejar mi bici aquí?', pt: 'Posso deixar a minha bicicleta aqui?', nl: 'Mag ik mijn fiets hier laten staan?' },
  { g: 'bike', en: 'Is this road open for bikes?', fr: 'Cette route est-elle ouverte aux vélos ?', it: 'Questa strada è aperta alle bici?' , es: '¿Esta carretera está abierta a bicis?', pt: 'Esta estrada está aberta a bicicletas?', nl: 'Is deze weg open voor fietsen?' },
  { g: 'bike', en: 'Can I take my bike on the train?', fr: 'Je peux prendre mon vélo dans le train ?', it: 'Posso portare la bici sul treno?' , es: '¿Puedo llevar la bici en el tren?', pt: 'Posso levar a bicicleta no comboio?', nl: 'Mag mijn fiets mee in de trein?' },
  { g: 'sleep', en: 'Do you have a room for tonight?', fr: 'Avez-vous une chambre pour ce soir ?', it: 'Avete una camera per stanotte?' , es: '¿Tiene una habitación para esta noche?', pt: 'Tem um quarto para esta noite?', nl: 'Heeft u een kamer voor vannacht?' },
  { g: 'sleep', en: 'Can I camp here?', fr: 'Je peux camper ici ?', it: 'Posso campeggiare qui?' , es: '¿Puedo acampar aquí?', pt: 'Posso acampar aqui?', nl: 'Mag ik hier kamperen?' },
  { g: 'sleep', en: 'Where can I fill up water?', fr: 'Où est-ce que je peux remplir de l’eau ?', it: 'Dove posso prendere acqua?' , es: '¿Dónde puedo coger agua?', pt: 'Onde posso encher água?', nl: 'Waar kan ik water bijvullen?' },
  { g: 'sleep', en: 'Is there a shop nearby?', fr: 'Il y a un magasin près d’ici ?', it: 'C’è un negozio qui vicino?' , es: '¿Hay una tienda cerca?', pt: 'Há uma loja aqui perto?', nl: 'Is er een winkel in de buurt?' },
  { g: 'sleep', en: 'The bill, please', fr: 'L’addition, s’il vous plaît', it: 'Il conto, per favore' , es: 'La cuenta, por favor', pt: 'A conta, por favor', nl: 'De rekening, alstublieft' },
  { g: 'sleep', en: 'I am vegetarian', fr: 'Je suis végétarien', it: 'Sono vegetariano' , es: 'Soy vegetariano', pt: 'Sou vegetariano', nl: 'Ik ben vegetariër' },
  { g: 'help', en: 'I need help', fr: 'J’ai besoin d’aide', it: 'Ho bisogno di aiuto' , es: 'Necesito ayuda', pt: 'Preciso de ajuda', nl: 'Ik heb hulp nodig' },
  { g: 'help', en: 'Please call an ambulance', fr: 'Appelez une ambulance, s’il vous plaît', it: 'Chiami un’ambulanza, per favore' , es: 'Llame a una ambulancia, por favor', pt: 'Chame uma ambulância, por favor', nl: 'Bel alstublieft een ambulance' },
  { g: 'help', en: 'I had an accident', fr: 'J’ai eu un accident', it: 'Ho avuto un incidente' , es: 'He tenido un accidente', pt: 'Tive um acidente', nl: 'Ik heb een ongeluk gehad' },
  { g: 'help', en: 'Where is the nearest pharmacy?', fr: 'Où est la pharmacie la plus proche ?', it: 'Dov’è la farmacia più vicina?' , es: '¿Dónde está la farmacia más cercana?', pt: 'Onde fica a farmácia mais próxima?', nl: 'Waar is de dichtstbijzijnde apotheek?' },
  { g: 'help', en: 'I am lost', fr: 'Je suis perdu', it: 'Mi sono perso' , es: 'Me he perdido', pt: 'Estou perdido', nl: 'Ik ben verdwaald' },
  { g: 'help', en: 'Where is the train station?', fr: 'Où est la gare ?', it: 'Dov’è la stazione?' , es: '¿Dónde está la estación de tren?', pt: 'Onde fica a estação de comboios?', nl: 'Waar is het station?' },
];

/** The sentences of a group whose own line or translation contains the words (search). */
export function findPhrases(q, tr = (s) => s, group = '') {
  const words = String(q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return PHRASES.filter((p) => (!group || p.g === group) && words.every((w) => [tr(p.en), ...PHRASE_LANGS.map((l) => p[l.key])].some((s) => String(s).toLowerCase().includes(w))));
}
