import json
from pathlib import Path

from app.questionnaire.llm_agent import DEFAULT_LANG, localized

_TREE_PATH = Path(__file__).parent / "cognitive_tree.json"


def load_tree(path: Path | None = None) -> dict:
    with open(path or _TREE_PATH, encoding="utf-8") as f:
        return json.load(f)


_TREE = load_tree()


def get_tree() -> dict:
    return _TREE


def new_state() -> dict:
    return {
        "current_node": _TREE["config"]["entryNode"],
        "answers": [],
        "pendingFollowUps": [],
        "questionsAsked": 0,
    }


def current_node(state: dict) -> dict | None:
    nid = state.get("current_node")
    if nid is None or nid == "END":
        return None
    return _TREE["nodes"][nid]


def is_finished(state: dict) -> bool:
    return state.get("current_node") in (None, "END")


def _match(when: dict, value: str) -> bool:
    if "answer" in when:
        return when["answer"] == "any" or when["answer"] == value
    if "in" in when:
        return value in when["in"]
    return False


def _resolve_next(node: dict, value: str) -> str:
    for branch in node.get("branches", []):
        if _match(branch.get("when", {}), value):
            return branch["next"]
    return node.get("defaultNext", "END")


def submit_answer(state: dict, value: str, *, is_follow_up: bool = False) -> dict:
    node = current_node(state)
    if node is None:
        raise ValueError("questionnaire already finished, no current node to answer")

    options = {o["value"]: o for o in node.get("options", [])}
    opt = options.get(value)
    if opt is None:
        raise ValueError(f"{value!r} is not a valid option for node {state['current_node']!r} "
                         f"(expected one of {sorted(options)})")

    state["answers"].append({
        "nodeId": state["current_node"],
        "value": value,
        "score": opt.get("score", 0),
        "isFollowUp": is_follow_up,
    })
    state["questionsAsked"] += 1

    max_q = _TREE["config"]["maxQuestions"]
    if state["questionsAsked"] >= max_q:
        state["current_node"] = "END"
    elif not is_follow_up:
        state["current_node"] = _resolve_next(node, value)
        state["pendingFollowUps"] = []
    return state


def queue_followup(state: dict, followup_id: str) -> None:
    state["pendingFollowUps"].append(followup_id)


def default_option_value(node: dict) -> str:
    options = node.get("options", [])
    return min(options, key=lambda o: o.get("score", 0))["value"]


def available_followups(state: dict) -> list[dict]:
    node = current_node(state)
    if node is None:
        return []
    asked = set(state.get("pendingFollowUps", []))
    max_per_node = _TREE["config"]["maxFollowUpsPerNode"]
    if len(asked) >= max_per_node:
        return []
    return [fu for fu in node.get("followUps", []) if fu["id"] not in asked]


def _score_by_scale(state: dict) -> dict:
    totals: dict[str, int] = {}
    for ans in state["answers"]:
        node = _TREE["nodes"][ans["nodeId"]]
        scale = node.get("scale")
        if scale:
            totals[scale] = totals.get(scale, 0) + ans["score"]
    return totals


def _findings_and_flags(state: dict, lang: str = DEFAULT_LANG) -> tuple[dict, list[str]]:
    by_domain: dict[str, list[str]] = {}
    red_flags: list[str] = []
    for ans in state["answers"]:
        node = _TREE["nodes"][ans["nodeId"]]
        opt = next((o for o in node.get("options", []) if o["value"] == ans["value"]), None)
        if not opt:
            continue
        section = node.get("section", "other")
        for key in ("finding", "alsoFinding"):
            if opt.get(key):
                by_domain.setdefault(section, []).append(opt[key])
        if opt.get("redFlag"):
            red_flags.append(localized(opt, "redFlag", lang))
    return by_domain, red_flags


_SEVERITY_BANDS = (
    (0.0, "none"),
    (0.34, "mild"),
    (0.67, "moderate"),
    (1.01, "severe"),
)


def _domain_severity(domain_findings: list[str], section_id: str) -> str:
    total_nodes = sum(1 for n in _TREE["nodes"].values() if n.get("section") == section_id)
    ratio = len(domain_findings) / total_nodes if total_nodes else 0.0
    for threshold, label in _SEVERITY_BANDS:
        if ratio <= threshold:
            return label
    return "severe"


_RISK_LABELS = {
    "fr": {
        "high": "Atteinte cognitive et fonctionnelle probable — évaluation approfondie recommandée",
        "moderate": "Atteinte cognitive probable dans au moins un domaine — évaluation complémentaire recommandée",
        "low": "Pas de signal net au dépistage — poursuivre la surveillance de routine",
    },
    "en": {
        "high": "Probable cognitive and functional impairment — in-depth assessment recommended",
        "moderate": "Probable cognitive impairment in at least one domain — further assessment recommended",
        "low": "No clear signal on screening — continue routine monitoring",
    },
}


def _global_risk(scale_scores: dict, lang: str = DEFAULT_LANG) -> dict:
    flagged = []
    for scale, score in scale_scores.items():
        cutoff = _TREE["scales"][scale]["cutoff"]
        if score >= cutoff:
            flagged.append(scale)
    level = "high" if len(flagged) >= 2 else "moderate" if len(flagged) == 1 else "low"
    labels = _RISK_LABELS.get(lang, _RISK_LABELS[DEFAULT_LANG])
    return {"level": level, "label": labels[level], "flaggedScales": flagged}


def _narrative(by_domain: dict, scale_scores: dict) -> str:
    sentences = []
    all_findings = [f for findings in by_domain.values() for f in findings]
    if all_findings:
        sentences.append("Patient reports " + ", ".join(all_findings) + ".")
    else:
        sentences.append("Patient reports no significant cognitive or functional complaints on screening.")
    for scale, score in scale_scores.items():
        info = _TREE["scales"][scale]
        flag = "above cutoff" if score >= info["cutoff"] else "within normal range"
        sentences.append(f"{scale} {score}/{info['max']} ({flag}).")
    return " ".join(sentences)


def build_summary(state: dict, *, tree_version: str | None = None,
                  lang: str = DEFAULT_LANG) -> dict:
    if not is_finished(state):
        raise ValueError("cannot build a summary before the questionnaire is finished")

    scale_scores = _score_by_scale(state)
    by_domain, red_flags = _findings_and_flags(state, lang)

    domains = []
    for section in _TREE["sections"]:
        sid = section["id"]
        findings = by_domain.get(sid, [])
        domains.append({
            "domain": sid,
            "label": localized(section, "label", lang),
            "severity": _domain_severity(findings, sid),
            "findings": findings,
        })

    scores = {}
    for scale, score in scale_scores.items():
        info = _TREE["scales"][scale]
        scores[scale] = {
            "label": localized(info, "label", lang),
            "score": score,
            "max": info["max"],
            "cutoff": info["cutoff"],
            "flag": "above_cutoff" if score >= info["cutoff"] else "within_range",
        }

    return {
        "treeVersion": tree_version or _TREE["version"],
        "questionsAsked": state["questionsAsked"],
        "scores": scores,
        "globalRisk": _global_risk(scale_scores, lang),
        "domains": domains,
        "redFlags": _dedupe(red_flags),
        "narrative": _narrative(by_domain, scale_scores),
        "transcript": state["answers"],
    }


def _dedupe(items: list[str]) -> list[str]:
    seen, out = set(), []
    for it in items:
        if it not in seen:
            seen.add(it)
            out.append(it)
    return out
