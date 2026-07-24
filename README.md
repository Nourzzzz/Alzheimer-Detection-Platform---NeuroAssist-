# NeuroAssist — Plateforme d'aide au diagnostic de la maladie d'Alzheimer

Plateforme de dépistage cognitif combinant classification d'IRM cérébrale par deep learning,
questionnaire cognitif adaptatif piloté par un LLM, et génération assistée de rapports cliniques (RAG),
avec validation obligatoire par un médecin avant tout retour au patient.

> **Avertissement** : cet outil est une aide au dépistage, pas un outil de diagnostic. Tout résultat généré par l'IA
> est explicitement présenté comme provisoire et doit être validé, corrigé ou rejeté par un médecin avant d'être
> communiqué au patient.

## Sommaire

- [Aperçu](#aperçu)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement](#lancement)
- [Configuration](#configuration)
- [Flux clinique](#flux-clinique)

## Aperçu

NeuroAssist orchestre trois signaux d'entrée pour produire une évaluation cognitive assistée par IA :

1. **Analyse d'IRM cérébrale** par un CNN (classification CN / MCI / AD), avec carte d'explicabilité Grad-CAM.
2. **Questionnaire cognitif adaptatif** : un arbre de décision clinique déterministe (mémoire, langage,
   orientation, autonomie fonctionnelle, humeur) dont les questions sont reformulées naturellement par un LLM
   local (LLaMA via Ollama) — le LLM ne décide jamais de la branche suivante, il reformule et interprète
   uniquement.
3. **Dossier clinique** rédigé par le médecin, dont sont extraits symptômes, traitements, diagnostics et
   antécédents via un modèle de NER biomédical.

Ces trois signaux alimentent une recherche documentaire (RAG) sur une base de connaissances indexée, puis un
rapport clinique est rédigé par un LLM. Le médecin valide, corrige ou rejette ce rapport avant qu'il ne soit
visible par le patient.

## Fonctionnalités principales

- Upload et classification d'IRM (médecin uniquement) avec carte de chaleur Grad-CAM
- Questionnaire cognitif conversationnel côté patient, avec relances contextuelles bornées et repli à choix
  fermé garantissant que le parcours se termine toujours
- Synthèse clinique structurée (scores par échelle, domaines, signaux d'alerte, narratif) consultable par le
  médecin, avec transcript complet disponible sur demande
- Extraction NER biomédicale hybride (modèle + règles sensibles à la négation)
- Recherche documentaire (RAG) avec reranking par cross-encoder sur une base de connaissances indexée
- Génération de rapport clinique par LLM, éditable par le médecin avant validation
- Workflow de validation médecin (valider / corriger / rejeter) avec vue anti-fuite côté patient
- Notification en temps quasi réel du nombre de validations en attente pour le médecin
- Gestion des comptes (admin / médecin / patient) avec authentification JWT

## Architecture

Architecture microservices : le Java orchestre, persiste et sert les API ; le Python fait tout le calcul IA et
n'est jamais routé directement par la passerelle publique.

| Service | Port | Techno | Rôle |
|---|---|---|---|
| `eureka-server` | 8761 | Spring Cloud Netflix Eureka | Annuaire / découverte de services |
| `api-gateway` | 8080 | Spring Cloud Gateway | Point d'entrée unique, routage, sécurité JWT, CORS |
| `auth-service` | 8081 | Spring Boot + MongoDB | Source unique de vérité des comptes (admin/médecin/patient), JWT |
| `questionnaire-service` | 8083 | Spring Boot + MongoDB | Session du questionnaire cognitif dynamique |
| `diagnosis-service` | 8084 | Spring Boot + MongoDB | IRM, évaluations IA, dossiers cliniques, base de connaissances, validation médecin |
| `alzheimer-ai` | 8000 | Python / FastAPI | CNN, arbre clinique + LLM, NER, RAG, génération de rapport |
| `alzheimer-frontend` | 4200 | Angular 22 (standalone, signals) | Interfaces Admin / Médecin / Patient |

`alzheimer-ai` ne persiste aucune donnée métier ; `questionnaire-service` persiste la session du questionnaire
sans jamais interpréter son contenu clinique — cette logique appartient entièrement à `alzheimer-ai`.

## Stack technique

**Backend Java** : Spring Boot 3.5, Java 21, Spring Cloud Gateway, Spring Cloud Netflix Eureka, Spring Security
(JWT), Spring Data MongoDB, OpenFeign, Lombok.

**IA / Python** : FastAPI, PyTorch (CNN ResNet18), Transformers (NER biomédical), sentence-transformers
(embeddings), cross-encoder (reranking RAG), LLaMA 3.1 8B via Ollama.

**Frontend** : Angular 22 (composants standalone, signals, nouvelle syntaxe de contrôle de flux `@if`/`@for`).

**Base de données** : MongoDB Atlas (une base par service : `users_db`, `questionnaire_db`, `diagnosis_db`).

## Structure du projet

```
alzheimer-platform/
├── eureka-server/          # Annuaire de services
├── api-gateway/            # Passerelle unique (routage + sécurité)
├── auth-service/           # Comptes, rôles, JWT
├── questionnaire-service/  # Questionnaire cognitif dynamique
├── diagnosis-service/      # IRM, évaluations IA, dossiers cliniques, validation
├── alzheimer-ai/           # Service Python : CNN, arbre clinique + LLM, NER, RAG
│   ├── app/
│   │   ├── cnn/            # Modèle de classification IRM + Grad-CAM
│   │   ├── rag/            # Indexation, embeddings, reranking, NER, génération de rapport
│   │   ├── questionnaire/  # Arbre de décision clinique + moteur + agent LLM
│   │   └── routers/        # Endpoints FastAPI
│   └── data/                # Datasets, checkpoints, base vectorielle (ignoré par git)
└── alzheimer-frontend/     # Application Angular
    └── src/app/
        ├── pages/          # Écrans (dashboard, questionnaire, revue d'évaluation, etc.)
        ├── components/     # Composants partagés (navbar, sidebar médecin)
        ├── services/       # Clients HTTP + état applicatif
        ├── models/         # Interfaces TypeScript des DTOs
        └── guards/         # Garde-fous de routes par rôle
```

## Prérequis

- Java 21
- Node.js + npm (Angular 22)
- Python 3.11+ avec un environnement virtuel
- Un cluster MongoDB (Atlas ou local)
- [Ollama](https://ollama.com) avec le modèle `llama3.1:8b` installé, pour la génération de rapport et le
  questionnaire (fonctionne en mode dégradé sans LLM : gabarits déterministes utilisés en repli)

## Installation

**Backend Java** (répéter pour chaque service : `eureka-server`, `api-gateway`, `auth-service`,
`questionnaire-service`, `diagnosis-service`) :

```bash
cd <service>
./mvnw clean install
```

**Service Python** :

```bash
cd alzheimer-ai
python -m venv venv
./venv/Scripts/activate   # ou source venv/bin/activate sous Linux/Mac
pip install -r requirements.txt
```

**Frontend Angular** :

```bash
cd alzheimer-frontend
npm install
```

## Lancement

Démarrer dans cet ordre (chaque service dépend du précédent pour s'enregistrer/se découvrir) :

```bash
# 1. Annuaire de services
cd eureka-server && ./mvnw spring-boot:run

# 2. Passerelle
cd api-gateway && ./mvnw spring-boot:run

# 3. Services métier (peuvent démarrer en parallèle une fois Eureka up)
cd auth-service && ./mvnw spring-boot:run
cd questionnaire-service && ./mvnw spring-boot:run
cd diagnosis-service && ./mvnw spring-boot:run

# 4. Service IA
cd alzheimer-ai && ./venv/Scripts/python.exe -m uvicorn main:app --port 8000

# 5. Ollama (si rapport/questionnaire LLM souhaités)
ollama serve

# 6. Frontend
cd alzheimer-frontend && npm start
```

L'application est ensuite accessible sur `http://localhost:4200`, tout le trafic passant par la passerelle sur
`http://localhost:8080`.

Un compte administrateur est créé automatiquement au premier démarrage d'`auth-service`
(`admin@alzheimer.com`, mot de passe configurable via `ADMIN_PASSWORD`).

## Configuration

Principales variables d'environnement (valeurs par défaut adaptées au développement local) :

| Variable | Service | Défaut | Rôle |
|---|---|---|---|
| `EUREKA_URI` | tous | `http://localhost:8761/eureka/` | Annuaire de services |
| `AI_SERVICE_URL` | diagnosis-service, questionnaire-service | `http://localhost:8000` | URL du service Python |
| `OLLAMA_URL` | alzheimer-ai | `http://localhost:11434` | Serveur Ollama |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | auth-service | `admin@alzheimer.com` / `Admin123!` | Compte admin de démarrage |

Les chaînes de connexion MongoDB et le secret JWT sont définis dans le `application.yaml` de chaque service —
à externaliser en variables d'environnement avant tout déploiement réel.

## Flux clinique

```
IRM ─────────┐
              ├─► CNN (classification + Grad-CAM) ─┐
Questionnaire ─┤                                    ├─► RAG + NER ─► Rapport LLM ─► Validation médecin ─► Patient
cognitif       │                                    │
Dossier ───────┘                                    │
clinique                                            │
```

Le lancement de l'analyse IRM est bloqué (409) tant que le patient n'a pas terminé son questionnaire cognitif et
que le médecin n'a pas rempli le dossier clinique. Le patient ne voit jamais le détail brut de l'IA (classes CNN,
scores internes) tant qu'un médecin n'a pas validé, corrigé ou rejeté l'évaluation.
