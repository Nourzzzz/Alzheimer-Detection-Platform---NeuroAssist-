import logging

from fastapi import APIRouter, HTTPException

from app.questionnaire import engine, llm_agent
from app.schemas import (
    QuestionnaireNextRequest,
    QuestionnaireNextResponse,
    QuestionnaireQuestion,
    QuestionnaireSummaryRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/questionnaire", tags=["questionnaire"])

_MAX_FORCED_ATTEMPTS = 2


def _question_for(node_id: str, node: dict, *, is_follow_up: bool = False,
                  forced_choice: bool = False, override_intent: str | None = None) -> QuestionnaireQuestion:
    phrasing_node = dict(node, intent=override_intent) if override_intent else node
    text = llm_agent.phrase_question(phrasing_node)
    options = [{"value": o["value"], "label": o["label"]} for o in node.get("options", [])]
    return QuestionnaireQuestion(
        node_id=node_id, text=text, answer_type=node.get("answerType", "free_text"),
        options=options, is_follow_up=is_follow_up, forced_choice=forced_choice,
    )


@router.post("/next", response_model=QuestionnaireNextResponse)
def next_step(req: QuestionnaireNextRequest):
    if req.state is None:
        state = engine.new_state()
        node_id = state["current_node"]
        node = engine.get_tree()["nodes"][node_id]
        return QuestionnaireNextResponse(state=state, finished=False,
                                         question=_question_for(node_id, node))

    state = req.state
    if engine.is_finished(state):
        raise HTTPException(status_code=400, detail="This questionnaire run is already finished.")
    if req.answer is None or not req.answer.strip():
        raise HTTPException(status_code=400, detail="'answer' is required to advance a started run.")

    node_id = state["current_node"]
    node = engine.get_tree()["nodes"][node_id]

    pending_text = state.get("_pendingText")
    combined = f"{pending_text} {req.answer}".strip() if pending_text else req.answer

    try:
        value = llm_agent.normalize_answer(node, combined)
    except Exception:
        logger.exception("Answer normalization failed for node %s", node_id)
        value = None

    if value is not None:
        state["_pendingText"] = None
        state["_forcedAttempts"] = 0
        engine.submit_answer(state, value)
        if engine.is_finished(state):
            return QuestionnaireNextResponse(state=state, finished=True,
                                             summary=engine.build_summary(state))
        next_id = state["current_node"]
        next_node = engine.get_tree()["nodes"][next_id]
        return QuestionnaireNextResponse(state=state, finished=False,
                                         question=_question_for(next_id, next_node))

    followups = engine.available_followups(state)
    if followups:
        fu = followups[0]
        engine.queue_followup(state, fu["id"])
        state["_pendingText"] = combined
        return QuestionnaireNextResponse(
            state=state, finished=False,
            question=_question_for(node_id, node, is_follow_up=True, override_intent=fu["intent"]),
        )

    forced_attempts = state.get("_forcedAttempts", 0) + 1
    state["_forcedAttempts"] = forced_attempts
    if forced_attempts > _MAX_FORCED_ATTEMPTS:
        state["_pendingText"] = None
        state["_forcedAttempts"] = 0
        engine.submit_answer(state, engine.default_option_value(node))
        if engine.is_finished(state):
            return QuestionnaireNextResponse(state=state, finished=True,
                                             summary=engine.build_summary(state))
        next_id = state["current_node"]
        next_node = engine.get_tree()["nodes"][next_id]
        return QuestionnaireNextResponse(state=state, finished=False,
                                         question=_question_for(next_id, next_node))

    state["_pendingText"] = None
    state["pendingFollowUps"] = []
    forced = _question_for(node_id, node, is_follow_up=True, forced_choice=True,
                           override_intent="Pouvez-vous choisir la réponse qui correspond le mieux, "
                                          "parmi les options proposées ?")
    return QuestionnaireNextResponse(state=state, finished=False, question=forced)


@router.post("/summary")
def summary(req: QuestionnaireSummaryRequest):
    if not engine.is_finished(req.state):
        raise HTTPException(status_code=400, detail="Cannot summarize a run that isn't finished.")
    return engine.build_summary(req.state)
