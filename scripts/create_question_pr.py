"""
Auto-creates a GitHub PR for a new interview question submitted via GitHub Issue.
Parses the structured issue form, optionally calls Claude to fill missing fields,
then commits to a new branch and opens a PR.
"""
import os
import re
import json
import time
import anthropic
from github import Github, GithubException

# ──────────────────────────────────────────────
# 1. Parse the GitHub Issue form body
# ──────────────────────────────────────────────
def parse_issue_body(body: str) -> dict:
    """Extract field values from the GitHub Issue form markdown format."""
    sections = re.split(r'(?m)^###\s+', body)
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


# ──────────────────────────────────────────────
# 2. Use Claude to enrich missing fields
# ──────────────────────────────────────────────
def enrich_with_ai(fields: dict) -> dict:
    """Fill idealAnswer, pitfalls, followUpQuestions via Claude if empty."""
    needs_enrichment = (
        not fields.get('Ideal answer') or
        not fields.get('Common pitfalls') or
        not fields.get('Follow-up questions')
    )
    if not needs_enrichment:
        return fields

    print("⚡ Calling Claude to enrich missing fields...")
    client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])

    prompt = f"""You are an expert Java interviewer. Generate missing interview question metadata.

Category: {fields.get('Category', 'general')}
Difficulty: {fields.get('Difficulty', 'medium')}
Title: {fields.get('Question title', '')}
Scenario: {fields.get('Scenario / context', '')}
Question: {fields.get('The interview question', '')}
Existing ideal answer: {fields.get('Ideal answer', '(none — generate this)')}
Existing pitfalls: {fields.get('Common pitfalls', '(none — generate this)')}
Existing follow-ups: {fields.get('Follow-up questions', '(none — generate these)')}

Return ONLY a valid JSON object (no markdown) with these keys:
{{
  "Ideal answer": "...",
  "Common pitfalls": "...",
  "Follow-up questions": "...\n...\n..."
}}

Only overwrite fields that were empty above. Preserve existing values verbatim."""

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r'^```json|```$', '', raw, flags=re.MULTILINE).strip()
    try:
        enriched = json.loads(raw)
        # Update fields with enriched data
        for key, value in enriched.items():
            if not fields.get(key):
                fields[key] = value
        return fields
    except json.JSONDecodeError as e:
        # Fallback: try to find JSON if Claude added text
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                enriched = json.loads(match.group())
                # Update fields with enriched data
                for key, value in enriched.items():
                    if not fields.get(key):
                        fields[key] = value
                return fields
            except json.JSONDecodeError:
                print(f"❌ Failed to parse AI response: {e}")
                return fields
        else:
            print("❌ Failed to parse AI response")
            return fields


# ──────────────────────────────────────────────
# 3. Build the question object
# ──────────────────────────────────────────────
def build_question_obj(fields: dict, issue_number: int) -> dict:
    slug = re.sub(r'[^a-z0-9]+', '-', fields.get('Question title', 'unknown').lower()).strip('-')[:40]
    question_id = f"q-{slug}-i{issue_number}"

    tags_raw = fields.get('Tags (comma-separated)', '')
    tags = [t.strip().lower().replace(' ', '-') for t in tags_raw.split(',') if t.strip()]

    follow_ups_raw = fields.get('Follow-up questions', '')
    if isinstance(follow_ups_raw, list):
        follow_ups = follow_ups_raw
    else:
        follow_ups = [q.strip() for q in follow_ups_raw.split('\n') if q.strip()]

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


# ──────────────────────────────────────────────
# 4. Patch the questions.ts file
# ──────────────────────────────────────────────
def patch_questions_file(existing_content: str, obj: dict) -> str:
    """Insert the new question object into the questions array."""
    entry = json.dumps(obj, indent=2)
    # Indent each line by 2 spaces for array member formatting
    indented = '\n'.join('  ' + line for line in entry.split('\n'))

    if 'export const questions' in existing_content:
        # Find last ] and insert before it
        insert_at = existing_content.rfind(']')
        return (
            existing_content[:insert_at].rstrip().rstrip(',') +
            ',\n' + indented + '\n' +
            existing_content[insert_at:]
        )
    else:
        return f"export const questions = [\n{indented}\n];\n"


# ──────────────────────────────────────────────
# 5. Orchestrate: create branch → commit → PR
# ──────────────────────────────────────────────
def main():
    repo_name = os.environ['REPO_FULL_NAME']
    issue_number = int(os.environ['ISSUE_NUMBER'])
    issue_body = os.environ['ISSUE_BODY']

    print(f"📋 Processing issue #{issue_number} in {repo_name}")

    fields = parse_issue_body(issue_body)
    print(f"✅ Parsed fields: {list(fields.keys())}")

    fields = enrich_with_ai(fields)
    print("✅ AI enrichment done")

    obj = build_question_obj(fields, issue_number)
    branch_name = f"feat/add-question-{obj['id']}"
    print(f"🌿 Target branch: {branch_name}")

    g = Github(os.environ['GITHUB_TOKEN'])
    repo = g.get_repo(repo_name)

    # Get current main SHA
    main_ref = repo.get_git_ref("heads/main")
    main_sha = main_ref.object.sha

    # Create branch
    try:
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=main_sha)
        print(f"✅ Branch {branch_name} created")
    except GithubException as e:
        if e.status == 422:
            print(f"⚠️  Branch already exists, continuing...")
        else:
            raise

    # Get existing questions.ts content
    file_path = "src/data/questions.ts"
    try:
        file_obj = repo.get_contents(file_path, ref="main")
        existing_content = file_obj.decoded_content.decode('utf-8')
        file_sha = file_obj.sha
    except GithubException:
        existing_content = ""
        file_sha = None

    updated_content = patch_questions_file(existing_content, obj)

    commit_msg = f"feat: add question — {obj['title'][:60]}\n\nResolves #{issue_number}"
    update_kwargs = dict(
        path=file_path,
        message=commit_msg,
        content=updated_content.encode('utf-8'),
        branch=branch_name,
    )
    if file_sha:
        update_kwargs['sha'] = file_sha

    repo.update_file(**update_kwargs) if file_sha else repo.create_file(**update_kwargs)
    print("✅ File committed")

    # Create PR
    pr_body = f"""## 🆕 New interview question (auto-generated from Issue #{issue_number})

**Category:** `{obj['category']}`
**Difficulty:** `{obj['difficulty']}`
**FAANG focus:** `{obj['faangFocus']}`
**Tags:** {', '.join(f'`{t}`' for t in obj['tags'])}

---

### Question
{obj['question']}

### Ideal answer
{obj['idealAnswer']}

### Common pitfalls
{obj['pitfalls']}

### Follow-up questions
{chr(10).join(f'- {q}' for q in obj['followUpQuestions'])}

---
*This PR was auto-created by the question submission workflow. Review the generated content before merging.*

Closes #{issue_number}"""

    pr = repo.create_pull(
        title=f"feat: add question — {obj['title'][:60]}",
        head=branch_name,
        base="main",
        body=pr_body,
        draft=False,
    )
    print(f"🎉 PR created: {pr.html_url}")

    # Comment on the issue with the PR link
    issue = repo.get_issue(issue_number)
    issue.create_comment(
        f"✅ **Auto-PR created:** {pr.html_url}\n\n"
        f"The question metadata has been generated and a pull request is ready for review. "
        f"Please check the JSON content before approving the merge."
    )
    print("✅ Comment posted on issue")


if __name__ == "__main__":
    main()
