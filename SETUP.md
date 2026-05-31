# Question Submission Automation — Setup Guide

## What this does

Two complementary ways to add questions without manual JSON editing:

| Method | Best for |
|--------|----------|
| **Web Portal** (the React artifact in Claude) | You / trusted contributors — instant PR with live AI preview |
| **GitHub Issue form** | Community contributors — they fill a form, workflow auto-creates the PR |

## Files to add to your repo

```
.github/
  workflows/
    auto-question-pr.yml      ← GitHub Actions workflow
  ISSUE_TEMPLATE/
    new_question.yml          ← Structured issue form
scripts/
  create_question_pr.py       ← Python automation script
```

## One-time setup (5 minutes)

### Step 1 — Add secrets to GitHub

Go to **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|-------------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (sk-ant-...) |

> `GITHUB_TOKEN` is automatic — GitHub provides it to every workflow.

### Step 2 — Copy the files

Copy the three files above into your repository at the paths shown. Commit to `main`.

### Step 3 — Enable Issues (if not already)

Settings → General → Features → tick **Issues**

### Step 4 — Test it

Go to your repo → Issues → New Issue → you'll see **"Submit a new interview question"** as a template. Fill it in — within ~60 seconds a PR will appear.

## How the AI enrichment works

When a submitter leaves `idealAnswer`, `pitfalls`, or `followUpQuestions` blank, the workflow:
1. Sends the question + context to Claude (`claude-sonnet-4-20250514`)
2. Gets structured JSON back with all three fields filled
3. Injects them into the question object before committing

If all fields are filled, Claude is not called at all (saves API credits).

## Web Portal usage (the form above in Claude chat)

1. Fill in **Core details** (step 1)
2. Click **Generate with AI** — Claude fills the answer, pitfalls, follow-ups
3. Review → click **Preview PR**
4. Paste your GitHub PAT (needs `repo` scope)
5. Click **Create PR on GitHub** — done, PR is live

The PAT is only used in-memory in your browser for that session, never stored.

## Question object schema

```typescript
{
  id: string,              // auto-generated slug + timestamp/issue-number
  categoryId: string,      // e.g. "concurrency", "spring-boot"
  title: string,           // short display title
  difficulty: "easy" | "medium" | "hard",
  tags: string[],          // lowercase, hyphen-separated
  scenario: string,        // interview context paragraph
  question: string,        // the actual question text
  idealAnswer: string,     // senior-level model answer
  pitfalls: string,        // common mistakes text
  followUpQuestions: string[],
  faangFocus: boolean
}
```

## Customizing categories

Edit the `options:` list in `.github/ISSUE_TEMPLATE/new_question.yml` and the `<select>` options in the web portal form to match your `categoryId` values.
