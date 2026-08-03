export const patientFr: Record<string, string> = {
  // ── Patient space ──
  'patient.greeting': 'Bonjour {name}',
  'patient.welcome':
    "Bienvenue sur votre espace personnel NeuroAssist. Complétez votre questionnaire cognitif et retrouvez ici les résultats une fois examinés par votre médecin — l'IRM, si nécessaire, est gérée directement par votre équipe soignante.",
  'patient.start.title': 'Commencer votre évaluation',
  'patient.start.text': "Un questionnaire conversationnel qui s'adapte à vos réponses, à votre rythme.",
  'patient.start.action': 'Commencer',
  'patient.resume.title': 'Reprendre une évaluation',
  'patient.resume.text': "Vous pouvez repasser le questionnaire à tout moment pour suivre l'évolution de vos résultats.",
  'patient.resume.action': 'Reprendre',
  'patient.status.title': 'Questionnaire transmis',
  'patient.status.text':
    "Vos réponses ont bien été transmises à votre médecin. Elles ne constituent pas un résultat : seul votre médecin peut les interpréter et vous les restituer.",
  'patient.status.action': 'Voir mes résultats validés',

  // ── Patient results ──
  'results.title': 'Mes résultats',
  'results.subtitle': 'Vos évaluations IRM, une fois examinées par votre médecin.',
  'results.empty':
    "Vous n'avez pas encore de résultat validé. Après l'envoi d'une IRM, elle reste en attente jusqu'à l'examen par votre médecin.",
  'results.error': 'Impossible de charger vos résultats.',
  'results.stage': 'Stade du diagnostic',
  'results.doctorComment': 'Commentaire du médecin',
  'results.reviewedOn': 'Examiné le {date}.',
  'results.guidance.eyebrow': 'Et maintenant ?',
  'results.guidance.calm': 'Continuez ainsi',
  'results.guidance.attention': 'Un point avec votre médecin est conseillé',
  'results.guidance.priority': 'Un accompagnement médical est recommandé',
  'results.guidance.default': 'Vos prochaines étapes',
  'patient.results.stageLabel': 'Stade retenu par votre médecin',
  'patient.results.status.NOT_READY': 'En préparation',
  'patient.results.status.PENDING_VALIDATION': 'En attente de votre médecin',
  'patient.results.status.REVISION_REQUESTED': 'En cours de révision',
  'patient.results.status.VALIDATED': 'Validé',
  'patient.results.status.CORRECTED': 'Corrigé par le médecin',
  'patient.results.status.REJECTED': 'Non retenu',
  'patient.results.message.NOT_READY':
    "Votre IRM a été analysée et attend la validation de votre médecin.",
  'patient.results.message.PENDING_VALIDATION':
    "Votre IRM a été analysée et attend la validation de votre médecin.",
  'patient.results.message.REVISION_REQUESTED':
    "Votre médecin a demandé une reprise de l'analyse. Le résultat vous sera transmis une fois revu.",
  'patient.results.message.VALIDATED': 'Votre résultat a été validé par votre médecin.',
  'patient.results.message.CORRECTED': 'Votre résultat a été revu et ajusté par votre médecin.',
  'patient.results.message.REJECTED':
    "Votre médecin a examiné cet examen et n'a pas retenu l'évaluation de l'IA.",
  'results.guidance.otherLang':
    "Ce texte est affiché dans la langue dans laquelle votre médecin l'a relu et validé.",
  'results.stage.CN': 'Cognition normale',
  'results.stage.MCI': 'Trouble cognitif léger',
  'results.stage.AD': "Maladie d'Alzheimer",

  // ── Ressources et groupes de soutien ──
  'results.resources.eyebrow': 'Vous n’êtes pas seul',
  'results.resources.title': 'Ressources et groupes de soutien',
  'results.resources.note':
    "Ces sites sont proposés par des organisations reconnues et sont indépendants de NeuroAssist. Ils complètent le suivi de votre médecin, ils ne le remplacent pas.",
  'results.resources.kind.association': 'Association',
  'results.resources.kind.support': 'Groupe de soutien',
  'results.resources.kind.learn': 'Comprendre',
  'results.resources.kind.prevention': 'Prévention',
  'results.resources.site.fr': 'Site en français',
  'results.resources.site.en': 'Site en anglais',

  // ── Cognitive questionnaire ──
  'quiz.loading': 'Chargement du questionnaire…',
  'quiz.loadError': 'Impossible de charger le questionnaire pour le moment.',
  'quiz.backHome': "Retour à l'accueil",
  'quiz.question': 'Question {n}',
  'quiz.freeText': 'Ou répondez avec vos propres mots :',
  'quiz.freeText.placeholder': 'Votre réponse…',
  'quiz.forcedChoice': 'Merci de choisir une des réponses proposées ci-dessus.',
  'quiz.submitError': "Une erreur est survenue lors de l'envoi de votre réponse. Veuillez réessayer.",
  'quiz.done.title': 'Questionnaire terminé',
  'quiz.done.thanks': "Merci d'avoir répondu à toutes les questions.",
  'quiz.done.note':
    "Important : ce questionnaire est un outil de dépistage, pas un diagnostic. Vos réponses ont été transmises à votre médecin, qui les examinera et déterminera les prochaines étapes si nécessaire.",
  'quiz.done.back': 'Retour à mon espace',
  'patient.quiz.important': 'Important :',
  'patient.quiz.done.noteBody':
    "ce questionnaire est un outil de dépistage, pas un diagnostic. Vos réponses ont été transmises à votre médecin, qui les examinera et déterminera les prochaines étapes si nécessaire.",

  // ── Legacy static questionnaire ──
  'patient.quiz.questionOf': 'Question {n} sur {total}',
  'patient.quiz.score': 'Score : {score} / {max}',
  'patient.quiz.category': 'Catégorie : ',
  'patient.quiz.risk.Low': 'Faible',
  'patient.quiz.risk.Moderate': 'Modéré',
  'patient.quiz.risk.Further Evaluation Recommended': 'Évaluation complémentaire conseillée',
  'patient.quiz.previous': 'Précédent',
  'patient.quiz.next': 'Suivant',
  'patient.quiz.finish': 'Terminer',
  'patient.quiz.legacy.noteBody':
    "ce questionnaire est un outil de dépistage, pas un diagnostic. Votre résultat sera examiné par votre équipe soignante, qui vous contactera pour en discuter et déterminer les prochaines étapes si nécessaire.",
  'patient.quiz.legacy.submitError':
    "Une erreur est survenue lors de l'envoi du questionnaire. Veuillez réessayer.",

  // ── Patient registration ──
  'patient.register.brandText':
    'Créez votre compte patient pour passer l’évaluation cognitive et suivre vos résultats dans le temps.',
  'patient.register.feature.secure': 'Espace sécurisé',
  'patient.register.feature.tracking': 'Suivi en temps réel',
  'patient.register.feature.community': 'Médecins et patients',
  'patient.register.title': 'Créer un compte',
  'patient.register.subtitle': 'Renseignez vos informations pour commencer.',
  'patient.register.firstName': 'Prénom',
  'patient.register.firstName.error': 'Le prénom est obligatoire (2 caractères minimum).',
  'patient.register.lastName': 'Nom',
  'patient.register.lastName.error': 'Le nom est obligatoire (2 caractères minimum).',
  'patient.register.email': 'Adresse e-mail',
  'patient.register.email.error': 'Une adresse e-mail valide est obligatoire.',
  'patient.register.password': 'Mot de passe',
  'patient.register.password.error': 'Le mot de passe doit contenir au moins 8 caractères.',
  'patient.register.phone': 'Téléphone',
  'patient.register.phone.error': 'Le numéro de téléphone est obligatoire.',
  'patient.register.birthDate': 'Date de naissance',
  'patient.register.birthDate.error': 'La date de naissance est obligatoire.',
  'patient.register.gender': 'Genre',
  'patient.register.gender.error': 'Veuillez sélectionner un genre.',
  'patient.register.gender.select': 'Sélectionner…',
  'patient.register.gender.female': 'Femme',
  'patient.register.gender.male': 'Homme',
  'patient.register.gender.other': 'Autre',
  'patient.register.doctor': 'Médecin référent',
  'patient.register.doctor.none': '— Aucun médecin —',
  'patient.register.submit': 'Créer mon compte',
  'patient.register.submitting': 'Création du compte…',
  'patient.register.haveAccount': 'Vous avez déjà un compte ? Se connecter',
  'patient.register.error': 'Une erreur est survenue lors de la création de votre compte.',
};

export const patientEn: Record<string, string> = {
  // ── Patient space ──
  'patient.greeting': 'Hello {name}',
  'patient.welcome':
    'Welcome to your personal NeuroAssist space. Complete your cognitive questionnaire and find your results here once your doctor has reviewed them — an MRI, if needed, is handled directly by your care team.',
  'patient.start.title': 'Start your assessment',
  'patient.start.text': 'A conversational questionnaire that adapts to your answers, at your own pace.',
  'patient.start.action': 'Start',
  'patient.resume.title': 'Take the assessment again',
  'patient.resume.text': 'You can retake the questionnaire at any time to track how your results evolve.',
  'patient.resume.action': 'Resume',
  'patient.status.title': 'Questionnaire submitted',
  'patient.status.text':
    'Your answers have been sent to your doctor. They are not a result: only your doctor can interpret them and share them with you.',
  'patient.status.action': 'View my reviewed results',

  // ── Patient results ──
  'results.title': 'My results',
  'results.subtitle': 'Your MRI assessments, once reviewed by your doctor.',
  'results.empty':
    'You have no validated results yet. After an MRI is uploaded, it stays pending until your doctor reviews it.',
  'results.error': 'Could not load your results.',
  'results.stage': 'Diagnosis stage',
  'results.doctorComment': "Doctor's comment",
  'results.reviewedOn': 'Reviewed on {date}.',
  'results.guidance.eyebrow': "What's next?",
  'results.guidance.calm': 'Keep it up',
  'results.guidance.attention': 'A check-in with your doctor is advised',
  'results.guidance.priority': 'Medical follow-up is recommended',
  'results.guidance.default': 'Your next steps',
  'patient.results.stageLabel': 'Stage confirmed by your doctor',
  'patient.results.status.NOT_READY': 'Being prepared',
  'patient.results.status.PENDING_VALIDATION': 'Awaiting your doctor',
  'patient.results.status.REVISION_REQUESTED': 'Under review',
  'patient.results.status.VALIDATED': 'Validated',
  'patient.results.status.CORRECTED': 'Corrected by the doctor',
  'patient.results.status.REJECTED': 'Not retained',
  'patient.results.message.NOT_READY':
    'Your MRI has been analysed and is awaiting validation by your doctor.',
  'patient.results.message.PENDING_VALIDATION':
    'Your MRI has been analysed and is awaiting validation by your doctor.',
  'patient.results.message.REVISION_REQUESTED':
    'Your doctor asked for the analysis to be redone. You will receive the result once it has been reviewed.',
  'patient.results.message.VALIDATED': 'Your result has been validated by your doctor.',
  'patient.results.message.CORRECTED': 'Your result has been reviewed and adjusted by your doctor.',
  'patient.results.message.REJECTED':
    'Your doctor reviewed this scan and did not retain the AI assessment.',
  'results.guidance.otherLang':
    'This text is shown in the language your doctor reviewed and approved it in.',
  'results.stage.CN': 'Normal cognition',
  'results.stage.MCI': 'Mild cognitive impairment',
  'results.stage.AD': "Alzheimer's disease",

  // ── Resources and support groups ──
  'results.resources.eyebrow': 'You are not alone',
  'results.resources.title': 'Resources and support groups',
  'results.resources.note':
    'These sites are run by recognised organisations and are independent of NeuroAssist. They complement your doctor’s follow-up, they do not replace it.',
  'results.resources.kind.association': 'Association',
  'results.resources.kind.support': 'Support group',
  'results.resources.kind.learn': 'Understand',
  'results.resources.kind.prevention': 'Prevention',
  'results.resources.site.fr': 'Site in French',
  'results.resources.site.en': 'Site in English',

  // ── Cognitive questionnaire ──
  'quiz.loading': 'Loading the questionnaire…',
  'quiz.loadError': 'The questionnaire cannot be loaded at the moment.',
  'quiz.backHome': 'Back to home',
  'quiz.question': 'Question {n}',
  'quiz.freeText': 'Or answer in your own words:',
  'quiz.freeText.placeholder': 'Your answer…',
  'quiz.forcedChoice': 'Please pick one of the answers above.',
  'quiz.submitError': 'Something went wrong while sending your answer. Please try again.',
  'quiz.done.title': 'Questionnaire complete',
  'quiz.done.thanks': 'Thank you for answering all the questions.',
  'quiz.done.note':
    'Important: this questionnaire is a screening aid, not a diagnosis. Your answers have been sent to your doctor, who will review them and decide on next steps if needed.',
  'quiz.done.back': 'Back to my space',
  'patient.quiz.important': 'Important:',
  'patient.quiz.done.noteBody':
    'this questionnaire is a screening aid, not a diagnosis. Your answers have been sent to your doctor, who will review them and decide on next steps if needed.',

  // ── Legacy static questionnaire ──
  'patient.quiz.questionOf': 'Question {n} of {total}',
  'patient.quiz.score': 'Score: {score} / {max}',
  'patient.quiz.category': 'Category: ',
  'patient.quiz.risk.Low': 'Low',
  'patient.quiz.risk.Moderate': 'Moderate',
  'patient.quiz.risk.Further Evaluation Recommended': 'Further evaluation recommended',
  'patient.quiz.previous': 'Previous',
  'patient.quiz.next': 'Next',
  'patient.quiz.finish': 'Finish',
  'patient.quiz.legacy.noteBody':
    'this questionnaire is a screening aid, not a diagnosis. Your result will be reviewed by your care team, who will contact you to discuss it and decide on next steps if needed.',
  'patient.quiz.legacy.submitError':
    'Something went wrong while sending the questionnaire. Please try again.',

  // ── Patient registration ──
  'patient.register.brandText':
    'Create your patient account to take the cognitive assessment and track your results over time.',
  'patient.register.feature.secure': 'Secure space',
  'patient.register.feature.tracking': 'Real-time tracking',
  'patient.register.feature.community': 'Doctors and patients',
  'patient.register.title': 'Create account',
  'patient.register.subtitle': 'Fill in your details to get started.',
  'patient.register.firstName': 'First name',
  'patient.register.firstName.error': 'First name is required (minimum 2 characters).',
  'patient.register.lastName': 'Last name',
  'patient.register.lastName.error': 'Last name is required (minimum 2 characters).',
  'patient.register.email': 'Email address',
  'patient.register.email.error': 'A valid email address is required.',
  'patient.register.password': 'Password',
  'patient.register.password.error': 'Password must be at least 8 characters long.',
  'patient.register.phone': 'Phone',
  'patient.register.phone.error': 'Phone number is required.',
  'patient.register.birthDate': 'Date of birth',
  'patient.register.birthDate.error': 'Date of birth is required.',
  'patient.register.gender': 'Gender',
  'patient.register.gender.error': 'Please select a gender.',
  'patient.register.gender.select': 'Select…',
  'patient.register.gender.female': 'Female',
  'patient.register.gender.male': 'Male',
  'patient.register.gender.other': 'Other',
  'patient.register.doctor': 'Referring doctor',
  'patient.register.doctor.none': '— No doctor —',
  'patient.register.submit': 'Create account',
  'patient.register.submitting': 'Creating account…',
  'patient.register.haveAccount': 'Already have an account? Sign in',
  'patient.register.error': 'An error occurred while creating your account.',
};
