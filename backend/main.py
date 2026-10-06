import requests

from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Keep your existing GitHub service
from services.github_service import get_beginner_issues


# =========================================================
# Configuration
# =========================================================

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:latest"


# =========================================================
# FastAPI app
# =========================================================

app = FastAPI(
    title="OpenCollab AI",
    description="AI-Powered Open Source Contribution Assistant",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Request model
# =========================================================

class GuidanceRequest(BaseModel):
    title: str
    description: str = ""
    repository: str = ""
    labels: List[str] = Field(default_factory=list)


# =========================================================
# Root
# =========================================================

@app.get("/")
def root():
    return {
        "message": "OpenCollab AI Backend is running!"
    }


# =========================================================
# Health
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# =========================================================
# GitHub Issues
# =========================================================

@app.get("/issues")
def get_issues():
    try:
        issues = get_beginner_issues()

        return {
            "count": len(issues),
            "issues": issues
        }

    except Exception as e:
        return {
            "count": 0,
            "issues": [],
            "error": str(e)
        }


# =========================================================
# AI Guidance using Ollama
# =========================================================

@app.post("/ai/guidance")
def get_ai_guidance(request: GuidanceRequest):

    # -----------------------------------------------------
    # Prepare issue information
    # -----------------------------------------------------

    title = request.title
    description = request.description
    repository = request.repository
    labels = request.labels

    labels_text = (
        ", ".join(labels)
        if labels
        else "No labels provided"
    )


    # -----------------------------------------------------
    # AI Prompt
    # -----------------------------------------------------

    prompt = f"""
You are OpenCollab AI, an AI assistant that helps beginners
understand and contribute to open-source GitHub projects.

Analyze the following GitHub issue.

Issue title:
{title}

Issue description:
{description}

Repository:
{repository}

Labels:
{labels_text}

Provide practical guidance for a beginner contributor.

Return the answer using exactly these sections:

SUMMARY:

A simple explanation of what the issue is asking.

DIFFICULTY:

Choose one:

- Beginner-friendly
- Beginner to Intermediate
- Intermediate

FIRST STEP:

Tell the contributor exactly what they should do first.

WHAT YOU NEED TO DO:

Give 5 to 7 clear numbered steps.

TIPS:

Give 4 to 5 useful tips for successfully solving the issue.

IMPORTANT:

Do not invent repository-specific files, functions, APIs,
or implementation details that are not present in the issue
information.

Keep the explanation practical and beginner-friendly.
"""


    # -----------------------------------------------------
    # Call Ollama
    # -----------------------------------------------------

    try:

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        ai_text = data.get("response", "")


        # -------------------------------------------------
        # Check for empty response
        # -------------------------------------------------

        if not ai_text:
            return {
                "error": "Ollama returned an empty response.",
                "details": "The model did not generate any text."
            }


        # -------------------------------------------------
        # Return AI response
        # -------------------------------------------------

        return {
            "title": title,
            "repository": repository,
            "guidance": ai_text
        }


    # -----------------------------------------------------
    # Ollama connection error
    # -----------------------------------------------------

    except requests.exceptions.ConnectionError:

        return {
            "error": "Could not connect to Ollama.",
            "details": (
                "Make sure Ollama is running at "
                "http://localhost:11434"
            )
        }


    # -----------------------------------------------------
    # Timeout
    # -----------------------------------------------------

    except requests.exceptions.Timeout:

        return {
            "error": "Ollama request timed out.",
            "details": (
                "The Llama 3.2 model took too long "
                "to generate a response."
            )
        }


    # -----------------------------------------------------
    # HTTP error
    # -----------------------------------------------------

    except requests.exceptions.HTTPError as e:

        return {
            "error": "Ollama returned an HTTP error.",
            "details": str(e)
        }


    # -----------------------------------------------------
    # Other errors
    # -----------------------------------------------------

    except Exception as e:

        return {
            "error": "Failed to generate AI guidance.",
            "details": str(e)
        }