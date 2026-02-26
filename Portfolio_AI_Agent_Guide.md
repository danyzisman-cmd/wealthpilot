# Portfolio AI Agent — Setup Guide

A Python script that pulls live market data, sends it to Claude for analysis, and delivers BUY/SELL/HOLD recommendations to your inbox, Slack, Notion, or a local file.

---

## 1. Prerequisites

- **Python 3.10+** (check with `python3 --version`)
- **Anthropic API key** from [console.anthropic.com](https://console.anthropic.com)

---

## 2. Install Dependencies

```bash
pip install yfinance anthropic
```

That's it — the script uses only these two packages plus the Python standard library.

---

## 3. Set Your API Key

**Mac / Linux:**
```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

To make it permanent, add that line to `~/.zshrc` (Mac) or `~/.bashrc` (Linux), then `source` the file.

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-api03-..."
```

To persist it, use System Properties → Environment Variables → New User Variable.

---

## 4. Edit Your Holdings

Open `portfolio_agent.py` and update the `PORTFOLIO` dict at the top with your actual positions:

```python
PORTFOLIO = {
    "AAPL": {"shares": 50, "avg_cost": 142.00, "account": "Taxable"},
    "VTI":  {"shares": 100, "avg_cost": 210.50, "account": "Roth IRA"},
    # ...
}
```

Each entry needs:
| Field | Type | Description |
|-------|------|-------------|
| `shares` | float | Number of shares you own |
| `avg_cost` | float | Your average cost per share |
| `account` | string | Where it's held (for context) |
| `yf_ticker` | string | *(optional)* Override if Yahoo Finance uses a different symbol |
| `skip_analysis` | bool | *(optional)* Set `True` for money market / cash positions |

Update `RECURRING` too if you have regular DCA transfers — Claude uses this to evaluate allocation.

---

## 5. Configure Delivery

### Local file (default)

Reports save to a `reports/` folder next to the script. No config needed.

### Email (Gmail)

1. Enable 2-factor auth on your Google account
2. Generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Fill in the config:

```python
SEND_EMAIL = True
EMAIL_FROM = "you@gmail.com"
EMAIL_TO   = "you@gmail.com"
SMTP_HOST  = "smtp.gmail.com"
SMTP_PORT  = 587
SMTP_USER  = "you@gmail.com"
SMTP_PASS  = "xxxx xxxx xxxx xxxx"  # the 16-char app password
```

### Slack

1. Create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) in your Slack workspace
2. Copy the webhook URL:

```python
SEND_SLACK       = True
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T.../B.../xxx"
```

### Notion

1. Create an [internal integration](https://www.notion.so/my-integrations)
2. Share a database with the integration
3. The database needs at least a **Name** (title) and **Date** (date) property

```python
POST_NOTION       = True
NOTION_API_KEY    = "secret_..."
NOTION_DATABASE_ID = "abc123..."
```

---

## 6. Run It

```bash
python3 portfolio_agent.py
```

You'll see it fetch each ticker, then print the full Claude analysis to the terminal.

---

## 7. Schedule It Overnight

### Mac (launchd / cron)

Run every weekday at 6:30 AM before market open:

```bash
crontab -e
```

Add this line:
```
30 6 * * 1-5  /usr/bin/env ANTHROPIC_API_KEY="sk-ant-..." /usr/local/bin/python3 /Users/you/wealthpilot/portfolio_agent.py >> ~/portfolio_log.txt 2>&1
```

> **Tip:** cron doesn't source your shell profile, so either inline the env var (as above) or wrap it in a shell script.

### Windows (Task Scheduler)

1. Open **Task Scheduler** → Create Basic Task
2. Trigger: Weekly, check Mon–Fri, time 6:30 AM
3. Action: Start a Program
   - Program: `python`
   - Arguments: `C:\path\to\portfolio_agent.py`
   - Start in: `C:\path\to\`
4. In the task properties, check **"Run whether user is logged on or not"**
5. Add the `ANTHROPIC_API_KEY` as a system environment variable

### Cloud (always-on, no laptop needed)

**GitHub Actions** (free tier, 2000 min/month):

Create `.github/workflows/portfolio.yml`:

```yaml
name: Portfolio Agent
on:
  schedule:
    - cron: "30 10 * * 1-5"  # 10:30 UTC = 6:30 AM ET
  workflow_dispatch:  # manual trigger button

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install yfinance anthropic
      - run: python portfolio_agent.py
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Store `ANTHROPIC_API_KEY` in repo Settings → Secrets → Actions.

**Other options:** AWS Lambda + EventBridge, Google Cloud Functions + Cloud Scheduler, or a $5/mo VPS with cron.

---

## 8. Agent Flow Summary

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐     ┌────────────┐
│ Yahoo Finance│────▶│ Calculate    │────▶│ Claude    │────▶│ Deliver    │
│ live prices  │     │ weights, P&L │     │ analysis  │     │ report     │
│ 52w range    │     │ 1mo/3mo perf │     │ BUY/SELL/ │     │            │
│ P/E, targets │     │ per position │     │ HOLD recs │     │ Email      │
│ analyst recs │     │              │     │ + rationale│    │ Slack      │
└─────────────┘     └──────────────┘     └───────────┘     │ Notion     │
                                                            │ Local file │
                                                            └────────────┘
```

---

## 9. Costs

- **Yahoo Finance:** Free (yfinance scrapes public data, no API key needed)
- **Claude API:** ~$0.01–0.05 per run (Sonnet), ~$0.10–0.30 per run (Opus)
- At once per weekday, expect **$0.50–$6/month** depending on model choice

---

## 10. Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: yfinance` | `pip install yfinance` |
| `ModuleNotFoundError: anthropic` | `pip install anthropic` |
| Ticker returns no price | Check the symbol on [finance.yahoo.com](https://finance.yahoo.com) — mutual funds may use a different ticker |
| Email auth fails | Make sure you're using a Gmail App Password, not your account password |
| Cron doesn't run | Check `ANTHROPIC_API_KEY` is set inline (cron doesn't load shell profiles) |
| Rate limited by Yahoo | Add a `time.sleep(1)` between fetches in the loop, or run less frequently |

---

## 11. Customization Ideas

- **Change the Claude model** — set `CLAUDE_MODEL = "claude-opus-4-6"` for deeper analysis
- **Add more tickers** — just add entries to the `PORTFOLIO` dict
- **Track crypto directly** — use `"yf_ticker": "BTC-USD"` for spot Bitcoin price
- **Compare to benchmarks** — add SPY/QQQ performance to the prompt context
- **Historical tracking** — reports save with dates, so you can diff them over time
