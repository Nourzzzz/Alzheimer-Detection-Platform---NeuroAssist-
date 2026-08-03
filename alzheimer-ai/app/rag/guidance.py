import logging
import re

import httpx

from app.config import (
    OLLAMA_KEEP_ALIVE,
    OLLAMA_MODEL,
    OLLAMA_TIMEOUT_S,
    OLLAMA_URL,
    RAG_USE_OLLAMA,
)

logger = logging.getLogger(__name__)

_GUIDANCE_NUM_PREDICT = 400
_MAX_GUIDANCE_CHARS = 2500

# The model occasionally slips into a first-person "I am here for you" voice.
# On text handed to an elderly patient as if it came from the care team, that
# implies a relationship that does not exist, so such a draft is discarded
# rather than shown - the prompt forbids it, this enforces it.
_FIRST_PERSON = re.compile(r"\b(je|j['’])", re.IGNORECASE)
# Case-sensitive on purpose: the English first-person pronoun is always capital
# "I", so this cannot fire on an "i" inside an ordinary word.
_FIRST_PERSON_EN = re.compile(r"\bI\b|\bI['’]m\b")

# Written once, reviewed as a whole, and never produced by the model: whatever
# the LLM does, the patient always receives at least this. Each entry stays
# non-alarming, avoids stating a diagnosis, and ends by pointing back to the
# treating doctor.
_BASE_GUIDANCE_FR = {
    "CN": (
        "Votre dépistage n'a pas mis en évidence de signe cognitif significatif.\n\n"
        "Ce que vous pouvez faire dès maintenant :\n"
        "- Maintenir une activité physique régulière (30 minutes de marche par jour suffisent).\n"
        "- Préserver un sommeil régulier et suffisant.\n"
        "- Garder une vie sociale active : échanges, sorties, activités partagées.\n"
        "- Stimuler la mémoire au quotidien : lecture, jeux, apprentissages nouveaux.\n"
        "- Faire surveiller la tension artérielle, le diabète et le cholestérol, "
        "qui influencent la santé du cerveau.\n\n"
        "Suivi conseillé :\n"
        "- Un nouveau dépistage dans 12 à 24 mois permet de suivre l'évolution.\n"
        "- Reparlez-en à votre médecin plus tôt si vous ou vos proches remarquez "
        "des oublis inhabituels."
    ),
    "MCI": (
        "Votre dépistage a relevé des éléments qui méritent d'être approfondis. "
        "Cela ne signifie pas qu'un diagnostic a été posé.\n\n"
        "Les prochaines étapes :\n"
        "- Prenez rendez-vous avec votre médecin pour discuter de ce résultat.\n"
        "- Une consultation spécialisée (neurologue ou consultation mémoire) peut être proposée.\n"
        "- Des examens complémentaires sont parfois nécessaires pour préciser la situation.\n\n"
        "Pour préparer ce rendez-vous :\n"
        "- Notez les situations concrètes qui vous ont marqué, avec leur date approximative.\n"
        "- Demandez à un proche ce qu'il a observé de son côté.\n"
        "- Apportez la liste complète de vos médicaments actuels.\n\n"
        "En attendant :\n"
        "- Maintenez activité physique, sommeil régulier et vie sociale.\n"
        "- Certaines causes réversibles (sommeil, thyroïde, carences, effets de "
        "médicaments, dépression) peuvent expliquer ces difficultés : votre médecin les recherchera."
    ),
    "AD": (
        "Votre dépistage a relevé des éléments significatifs qui nécessitent un "
        "accompagnement médical. Le diagnostic et la conduite à tenir reviennent à votre médecin.\n\n"
        "Les prochaines étapes :\n"
        "- Consultez votre médecin rapidement pour organiser la suite de la prise en charge.\n"
        "- Une consultation mémoire ou un avis neurologique sera généralement proposé.\n"
        "- Un bilan complet permettra de confirmer la situation et d'adapter la prise en charge.\n\n"
        "Un accompagnement existe :\n"
        "- Des prises en charge permettent de préserver l'autonomie et la qualité de vie.\n"
        "- Un accompagnement peut être proposé aux proches aidants.\n"
        "- Des aides pratiques et sociales existent : votre médecin ou une "
        "assistante sociale peut vous orienter.\n\n"
        "Au quotidien :\n"
        "- Conservez des repères stables : mêmes horaires, mêmes lieux, mémos écrits.\n"
        "- Maintenez les activités qui vous font plaisir et le lien avec vos proches.\n"
        "- Faites-vous accompagner pour les démarches administratives importantes."
    ),
}

_BASE_GUIDANCE_EN = {
    "CN": (
        "Your screening did not reveal any significant cognitive sign.\n\n"
        "What you can do now:\n"
        "- Keep up regular physical activity (a 30-minute walk a day is enough).\n"
        "- Protect a regular, sufficient night's sleep.\n"
        "- Stay socially active: conversations, outings, shared activities.\n"
        "- Exercise your memory day to day: reading, games, learning something new.\n"
        "- Have blood pressure, diabetes and cholesterol monitored, as they affect brain health.\n\n"
        "Suggested follow-up:\n"
        "- A repeat screening in 12 to 24 months helps track any change.\n"
        "- Speak to your doctor sooner if you or those close to you notice unusual forgetfulness."
    ),
    "MCI": (
        "Your screening picked up findings that deserve a closer look. "
        "This does not mean a diagnosis has been made.\n\n"
        "Next steps:\n"
        "- Book an appointment with your doctor to discuss this result.\n"
        "- A specialist consultation (neurologist or memory clinic) may be suggested.\n"
        "- Further tests are sometimes needed to clarify the situation.\n\n"
        "To prepare for that appointment:\n"
        "- Note the specific situations that struck you, with roughly when they happened.\n"
        "- Ask someone close to you what they have observed.\n"
        "- Bring the full list of your current medication.\n\n"
        "In the meantime:\n"
        "- Keep up physical activity, regular sleep and social contact.\n"
        "- Some reversible causes (sleep, thyroid, deficiencies, medication effects, depression) "
        "can explain these difficulties: your doctor will look into them."
    ),
    "AD": (
        "Your screening picked up significant findings that call for medical support. "
        "The diagnosis and what to do next are for your doctor to determine.\n\n"
        "Next steps:\n"
        "- See your doctor soon to organise ongoing care.\n"
        "- A memory clinic or neurological opinion will usually be proposed.\n"
        "- A full assessment will confirm the situation and shape the care plan.\n\n"
        "Support is available:\n"
        "- Care approaches exist that help preserve independence and quality of life.\n"
        "- Support can also be offered to family carers.\n"
        "- Practical and social assistance exists: your doctor or a social worker can guide you.\n\n"
        "Day to day:\n"
        "- Keep steady landmarks: same routines, same places, written reminders.\n"
        "- Keep doing what you enjoy and stay in touch with those close to you.\n"
        "- Ask for support with important administrative steps."
    ),
}

_BASE_GUIDANCE = {"fr": _BASE_GUIDANCE_FR, "en": _BASE_GUIDANCE_EN}

_DISCLAIMER = {
    "fr": "\n\nCes informations complètent l'avis de votre médecin, elles ne le remplacent pas.",
    "en": "\n\nThis information complements your doctor's advice; it does not replace it.",
}

DEFAULT_LANG = "fr"
SUPPORTED_LANGS = ("fr", "en")


def _base_for(stage: str, lang: str) -> str:
    table = _BASE_GUIDANCE.get(lang, _BASE_GUIDANCE[DEFAULT_LANG])
    return table.get((stage or "").upper(), table["MCI"])


_PERSONALIZE_EN = (
    "You are adapting health guidance written for an elderly patient, in English, "
    "in a calm and considerate tone. You NEVER state a diagnosis, you never name a "
    "medication, and you add no medical information that is not in the reference text.\n\n"
    "Strict rules:\n"
    "- Keep ALL the points of the reference text; remove none.\n"
    "- You may only reword more simply and mention the personal items below where relevant.\n"
    "- Keep the same structure, with dashes and short headings.\n"
    "- Invent no figure, no date, no specialist name.\n"
    "- NEVER write in the first person (\"I\", \"we\") and do not present yourself as an "
    "interlocutor, companion or carer. This guidance is the medical team's, not yours: "
    "stay impersonal.\n"
    "- Promise nothing and do not reassure artificially.\n\n"
    "Findings noted for this patient: {flags}.\n"
    "Symptoms mentioned in the record: {syms}.\n\n"
    "Reference text to adapt:\n{base}\n\n"
    "Reply with the adapted text only."
)


def _personalize(base: str, stage: str, red_flags: list[str], symptoms: list[str],
                 lang: str = DEFAULT_LANG) -> str | None:
    if not RAG_USE_OLLAMA:
        return None

    if lang == "en":
        flags = ", ".join(red_flags) if red_flags else "none reported"
        syms = ", ".join(symptoms) if symptoms else "none recorded"
        prompt = _PERSONALIZE_EN.format(flags=flags, syms=syms, base=base)
        return _run_personalization(prompt, lang)

    flags = ", ".join(red_flags) if red_flags else "aucun signalé"
    syms = ", ".join(symptoms) if symptoms else "aucun relevé"
    prompt = (
        "Tu adaptes des conseils de santé destinés à un patient âgé, en français, "
        "avec un ton calme et bienveillant. Tu ne poses JAMAIS de diagnostic, tu "
        "n'annonces aucun médicament, et tu n'ajoutes aucune information médicale "
        "qui ne figure pas dans le texte de référence.\n\n"
        "Règles strictes :\n"
        "- Conserve TOUS les points du texte de référence, sans en supprimer.\n"
        "- Tu peux seulement reformuler plus simplement et mentionner les éléments "
        "personnels ci-dessous là où c'est pertinent.\n"
        "- Garde la même structure avec des tirets et des titres courts.\n"
        "- N'invente aucun chiffre, aucune date, aucun nom de spécialiste.\n"
        "- N'écris JAMAIS à la première personne (\"je\", \"nous\") et ne te présente "
        "pas comme un interlocuteur, un accompagnant ou un soignant. Ces conseils "
        "sont ceux de l'équipe médicale, pas les tiens : reste impersonnel.\n"
        "- Ne promets rien et ne rassure pas artificiellement.\n\n"
        f"Éléments relevés chez ce patient : {flags}.\n"
        f"Symptômes mentionnés dans le dossier : {syms}.\n\n"
        f"Texte de référence à adapter :\n{base}\n\n"
        "Réponds uniquement avec le texte adapté."
    )

    return _run_personalization(prompt, lang)


def _run_personalization(prompt: str, lang: str) -> str | None:
    try:
        resp = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "keep_alive": OLLAMA_KEEP_ALIVE,
                "options": {"num_predict": _GUIDANCE_NUM_PREDICT, "temperature": 0.3},
            },
            timeout=OLLAMA_TIMEOUT_S,
        )
        resp.raise_for_status()
        text = (resp.json().get("response") or "").strip()
    except Exception as e:
        logger.warning("Guidance personalization failed (%s), using the base text", e)
        return None

    # A truncated or runaway generation is worse than the reviewed base text.
    if len(text) < 120 or len(text) > _MAX_GUIDANCE_CHARS:
        logger.warning("Guidance personalization rejected (length=%d), using the base text", len(text))
        return None
    if lang == DEFAULT_LANG and _FIRST_PERSON.search(text):
        logger.warning("Guidance personalization rejected (first-person voice), using the base text")
        return None
    if lang == "en" and _FIRST_PERSON_EN.search(text):
        logger.warning("Guidance personalization rejected (first-person voice), using the base text")
        return None
    return text


def build_guidance(stage: str, red_flags: list[str] | None = None,
                   symptoms: list[str] | None = None, lang: str = DEFAULT_LANG) -> str:
    base = _base_for(stage, lang)
    personalized = _personalize(base, stage, red_flags or [], symptoms or [], lang)
    disclaimer = _DISCLAIMER.get(lang, _DISCLAIMER[DEFAULT_LANG])
    return (personalized or base) + disclaimer
