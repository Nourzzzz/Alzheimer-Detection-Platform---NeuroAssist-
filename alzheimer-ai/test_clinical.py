import sys
import logging

logging.basicConfig(level=logging.WARNING)

from app.rag.clinical_bert import extract_clinical

EXAMPLES = [
    "The patient reports trouble remembering recent conversations and often gets lost. "
    "She was started on donepezil 5mg. Mr K denies hallucinations. "
    "No signs of depression. Occasional agitation noted in the evening.",
    "Prescribed memantine and rivastigmine; referred for cognitive therapy.",
    "No memory complaints. Denies confusion or agitation. Not on any medication.",
]


def show(note: str) -> None:
    result = extract_clinical(note)
    print("NOTE     :", note)
    print("SYMPTOMS :", result["symptoms"])
    print("TREATMENT:", result["treatments"])
    print("-" * 70)


if __name__ == "__main__":
    notes = sys.argv[1:] or EXAMPLES
    for n in notes:
        show(n)
