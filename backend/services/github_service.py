import requests


# =========================================================
# GitHub API
# =========================================================

GITHUB_API_URL = "https://api.github.com/search/issues"


# =========================================================
# Get beginner-friendly GitHub issues
# =========================================================

def get_beginner_issues():

    params = {
        "q": "is:issue is:open label:good-first-issue",
        "sort": "updated",
        "order": "desc",
        "per_page": 10
    }

    response = requests.get(
        GITHUB_API_URL,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    issues = []

    for item in data.get("items", []):

        issues.append({
            "title": item.get("title", ""),
            
            "repository": (
                item.get("repository_url", "").split("/")[-1]
            ),

            "description": item.get("body") or "",

            "url": item.get("html_url", ""),

            "labels": [
                label.get("name", "")
                for label in item.get("labels", [])
            ],

            "number": item.get("number"),

            "id": item.get("id")
        })

    return issues