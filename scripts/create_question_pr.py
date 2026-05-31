"""
Auto-creates a GitHub PR for a new interview question from a GitHub Issue.
Uses Google Gemini 1.5 Flash (free tier: 1500 req/day) for AI enrichment.
No paid APIs needed.
"""
import os
import re
import json
import requests
from github import Github, GithubException


GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent?key={key}"
)


def parse_issue_body(body: str) -> dict:
    """Parse GitHub Issue form markdown into a dict of field -> value."""
    sections = re.split(r'\n### ', '\n' + body)
    fields = {}
    for section in sections:
        if not section.strip():
            continue
        lines = section.strip().split('\n')
        key = lines[0].strip()
        value = '\n'.join(lines[1:]).strip()
        if value.lower() in ('_no response_', ''):
            value = ''
        fields[key] = value
    return fields


def enrich_with_gemini(fields: dict) -> dict:
    """Call Gemini 1.5 Flash to fill empty idealAnswer, pitfalls, followUpQuestions."""
    needs = (
        not fields.get('idealAnswer') or
        not fields.get('pitfalls') or
        not fields.get('followUpQuestions')
    )
    if not needs:
        print("All fields present, skipping Gemini call.")
        return fields

    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        print("WARNING: GEMINI_API_KEY not set. Skipping AI enrichment.")
        return fields

    print("Calling Gemini 1.5 Flash for AI enrichment...")

        prompt = f"""You are an expert Java interviewer. Generate missing interview question metadata.

Category: {fields.get('Category', 'general')}
Difficulty: {fields.get('Difficulty', 'medium')}
Title: {fields.get('Question title', '')}
Scenario: {fields.get('Scenario / context', '')}
Question: {fields.get('The interview question', '')}
Existing ideal answer: {fields.get('Ideal answer', '(none — generate this)')}
Existing pitfalls: {fields.get('Common pitfalls', '(none — generate this)')}
Existing follow-ups: {fields.get('Follow-up questions', '(none — generate these)')}

Return ONLY a valid JSON object (no markdown, no preamble) with these exact keys:
{{
  "idealAnswer": "3-5 sentence senior-engineer-level answer",
  "pitfalls": "2-3 specific mistakes candidates commonly make",
  "followUpQuestions": ["follow-up 1", "follow-up 2", "follow-up 3"]
}}
Only overwrite fields that were empty above. Preserve existing values verbatim."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }

    resp = requests.post(
        GEMINI_URL.format(key=api_key),
        json=payload,
        timeout=30
    )
    resp.raise_for_status()
    data = resp.json()

    raw = data['candidates'][0]['content']['parts'][0]['text']
    raw = re.sub(r'^```json|```$', '', raw, flags=re.MULTILINE).strip()
    enriched = json.loads(raw)

    if not fields.get('idealAnswer'):
        fields['idealAnswer'] = enriched.get('idealAnswer', '')
    if not fields.get('pitfalls'):
        fields['pitfalls'] = enriched.get('pitfalls', '')
    if not fields.get('followUpQuestions'):
        fups = enriched.get('followUpQuestions', [])
        fields['followUpQuestions'] = fups if isinstance(fups, list) else [fups]

    print("Gemini enrichment complete.")
    return fields


def build_question_obj(fields: dict, issue_number: int) -> dict:
    slug = re.sub(r'[^a-z0-9]+', '-', fields.get('Question title', 'unknown').lower()).strip('-')[:40]
    question_id = f"q-{slug}-i{issue_number}"

    tags_raw = fields.get('Tags (comma-separated)', '')
    tags = [t.strip().lower().replace(' ', '-') for t in tags_raw.split(',') if t.strip()]

    follow_ups_raw = fields.get('Follow-up questions', '')
    if isinstance(follow_ups_raw, list):
        follow_ups = follow_ups_raw
    else:
        follow_ups = [q.strip() for q in str(follow_ups_raw).split('\n') if q.strip()]

    return {
        "id": question_id,
        "category": fields.get('Category', '').strip(),
        "title": fields.get('Question title', '').strip(),
        "difficulty": fields.get('Difficulty', 'medium').strip(),
        "tags": tags,
        "scenario": fields.get('Scenario / context', '').strip(),
        "question": fields.get('The interview question', '').strip(),
        "idealAnswer": fields.get('Ideal answer', '').strip(),
        "pitfalls": fields.get('Common pitfalls', '').strip(),
        "followUpQuestions": follow_ups,
        "faangFocus": fields.get('FAANG-level question?', 'false').strip().lower() == 'true',
    }


def patch_questions_file(existing: str, obj: dict) -> str:
    entry = json.dumps(obj, indent=2)
    indented = '\n'.join('  ' + line for line in entry.split('\n'))
    if existing and 'export const questions' in existing:
        idx = existing.rfind(']')
        return existing[:idx].rstrip().rstrip(',') + ',\n' + indented + '\n' + existing[idx:]
    return f"export const questions = [\n{indented}\n];\n"


def main():
    repo_name = os.environ['REPO_FULL_NAME']
    issue_number = int(os.environ['ISSUE_NUMBER'])
    issue_body = os.environ['ISSUE_BODY']

    print(f"Processing issue #{issue_number} in {repo_name}")

    fields = parse_issue_body(issue_body)
    print(f"Parsed fields: {list(fields.keys())}")

    fields = enrich_with_gemini(fields)

    obj = build_question_obj(fields, issue_number)
    branch = f"feat/add-question-{obj['id']}"
    print(f"Target branch: {branch}")

    g = Github(os.environ['GITHUB_TOKEN'])
    repo = g.get_repo(repo_name)

    main_sha = repo.get_git_ref("heads/main").object.sha

    try:
        repo.create_git_ref(ref=f"refs/heads/{branch}", sha=main_sha)
    except GithubException as e:
        if e.status != 422:
            raise
        print("Branch already exists, continuing.")

    file_path = "src/data/questions.ts"
    try:
        f = repo.get_contents(file_path, ref="main")
        existing = f.decoded_content.decode('utf-8')
        file_sha = f.sha
    except GithubException:
        existing = ""
        file_sha = None

    updated = patch_questions_file(existing, obj)
    commit_msg = f"feat: add question — {obj['title'][:60]}\n\nResolves #{issue_number}"

    update_kwargs = dict(
        path=file_path,
        message=commit_msg,
        content=updated.encode('utf-8'),
        branch=branch,
    )
    if file_sha:
        update_kwargs['sha'] = file_sha
        repo.update_file(**update_kwargs)
    else:
        repo.create_file(**update_kwargs)

    print("File committed.")

    fups = obj['followUpQuestions']
    pr_body = f"""## New interview question (from Issue #{issue_number})

**Category:** `{obj['categoryId']}`  **Difficulty:** `{obj['difficulty']}`  **FAANG:** `{obj['faangFocus']}`
**Tags:** {', '.join(f'`{t}`' for t in obj['tags'])}

---

### Question
{obj['question']}

### Ideal answer
{obj['idealAnswer']}

### Common pitfalls
{obj['pitfalls']}

### Follow-up questions
{chr(10).join(f'- {q}' for q in fups)}

---
*Auto-generated by the question submission workflow using Gemini 1.5 Flash (free tier)*

Closes #{issue_number}"""

    pr = repo.create_pull(
        title=f"feat: add question — {obj['title'][:60]}",
        head=branch,
        base="main",
        body=pr_body,
    )
    print(f"PR created: {pr.html_url}")

    repo.get_issue(issue_number).create_comment(
        f"PR auto-created: {pr.html_url}\n\n"
        f"Gemini AI has generated the ideal answer, pitfalls, and follow-up questions. "
        f"Please review before merging."
    )
    print("Comment posted on issue.")


if __name__ == "__main__":
    main()
