from pydantic import BaseModel, Field


class MriPredictResponse(BaseModel):
    predicted_class: str
    confidence: float
    probabilities: dict[str, float]
    gradcam_image_base64: str | None = None


class IndexResponse(BaseModel):
    doc_id: str
    chunk_count: int
    char_count: int
    indexed: bool


class SearchHitModel(BaseModel):
    doc_id: str
    chunk_index: int
    text: str
    score: float


class SearchResponse(BaseModel):
    query: str
    hits: list[SearchHitModel]


class RagAssessRequest(BaseModel):
    predicted_class: str
    probabilities: dict[str, float] = Field(default_factory=dict)
    risk_score: float | None = None
    mri_features: list[str] = Field(default_factory=list)
    questionnaire_answers: list[str] = Field(default_factory=list)
    clinical_note: str = ""
    lang: str | None = None
    doctor_feedback: str | None = None
    previous_report: str | None = None
    cognitive_summary: str | None = None
    cognitive_risk_level: str | None = None
    cognitive_red_flags: list[str] = Field(default_factory=list)


class ClinicalBertModel(BaseModel):
    symptoms: list[str] = Field(default_factory=list)
    treatments: list[str] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)
    history: list[str] = Field(default_factory=list)


class RagContextItem(BaseModel):
    source: str
    doc_id: str
    title: str = ""
    snippet: str
    score: float


class RagAssessResponse(BaseModel):
    clinical_bert: ClinicalBertModel
    rag_context: list[RagContextItem]
    report: str
    """Guidance text keyed by language, so the patient can switch later on."""
    patient_guidance: dict[str, str] = {}


class QuestionOptionModel(BaseModel):
    value: str
    label: str


class QuestionnaireQuestion(BaseModel):
    node_id: str
    text: str
    answer_type: str
    options: list[QuestionOptionModel] = Field(default_factory=list)
    is_follow_up: bool = False
    forced_choice: bool = False


class QuestionnaireNextRequest(BaseModel):
    state: dict | None = None
    answer: str | None = None
    lang: str | None = None


class QuestionnaireNextResponse(BaseModel):
    state: dict
    finished: bool
    question: QuestionnaireQuestion | None = None
    summary: dict | None = None


class QuestionnaireSummaryRequest(BaseModel):
    state: dict
    lang: str | None = None
