#!/usr/bin/env python3
"""
Portfolio AI Agent — Daily investment analysis powered by Claude.

Pulls live prices, calculates portfolio metrics, sends everything to Claude
for BUY/SELL/HOLD recommendations, and delivers via email/Slack/Notion/file.

Usage:
    export ANTHROPIC_API_KEY="sk-ant-..."
    python3 portfolio_agent.py
"""

import os
import sys
import json
import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

try:
    import yfinance as yf
except ImportError:
    sys.exit("Missing dependency: pip install yfinance")

try:
    import anthropic
except ImportError:
    sys.exit("Missing dependency: pip install anthropic")


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION — Edit this section
# ═══════════════════════════════════════════════════════════════════════════

# ── Delivery toggles (flip to True and fill in credentials below) ──
SEND_EMAIL = False
SEND_SLACK = False
POST_NOTION = False
SAVE_LOCAL = True  # always saves a markdown file next to this script

# ── Email (Gmail example — use an App Password, not your real password) ──
EMAIL_FROM = ""
EMAIL_TO = ""
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = ""
SMTP_PASS = ""  # Generate at https://myaccount.google.com/apppasswords

# ── Slack incoming webhook ──
SLACK_WEBHOOK_URL = ""

# ── Notion integration ──
NOTION_API_KEY = ""
NOTION_DATABASE_ID = ""

# ── Portfolio holdings ─────────────────────────────────────────────────────
# Dany's Fidelity portfolio — Feb 2026
# Shares are combined across accounts for the same ticker.
#
# Format: "TICKER": {shares, avg_cost, account}
# Add "yf_ticker" if Yahoo Finance uses a different symbol than what you see.
PORTFOLIO = {
    "FXAIX": {
        "shares": 16.915,
        "avg_cost": 233.23,
        "account": "Roth IRA + 401k",
    },
    "QQQM": {
        "shares": 9.144,
        "avg_cost": 243.64,
        "account": "Roth IRA + Taxable",
    },
    "SPY": {
        "shares": 17.442,
        "avg_cost": 670.00,
        "account": "Roth IRA + Taxable",
    },
    "FSMDX": {
        "shares": 38.002,
        "avg_cost": 37.47,
        "account": "401k",
    },
    "FSPGX": {
        "shares": 54.259,
        "avg_cost": 45.79,
        "account": "401k",
    },
    "BTC": {
        "shares": 125.652,
        "avg_cost": 33.26,
        "account": "Taxable",
        "name": "Grayscale Bitcoin Mini Trust ETF",
    },
    "FCNTX": {
        "shares": 16.227,
        "avg_cost": 24.65,
        "account": "Taxable",
    },
    "SPAXX": {
        "shares": 592.61,
        "avg_cost": 1.00,
        "account": "Roth IRA + Taxable",
        "skip_analysis": True,  # money market, always ~$1
    },
}

# ── Recurring investments (DCA context for Claude) ──
RECURRING = [
    {"ticker": "BTC",   "amount": 300,    "frequency": "biweekly", "note": "Taxable brokerage"},
    {"ticker": "SPY",   "amount": 400,    "frequency": "biweekly", "note": "Taxable brokerage"},
    {"ticker": "FCNTX", "amount": 400,    "frequency": "biweekly", "note": "Taxable brokerage"},
    {"ticker": "FXAIX", "amount": 432.34, "frequency": "biweekly + monthly", "note": "401k (base $104.74 biweekly + commission $327.60 monthly)"},
    {"ticker": "FSPGX", "amount": 319.26, "frequency": "biweekly + monthly", "note": "401k (base $77.34 biweekly + commission $241.92 monthly)"},
    {"ticker": "FSMDX", "amount": 198.59, "frequency": "biweekly + monthly", "note": "401k (base $48.11 biweekly + commission $150.48 monthly)"},
]

# Claude model — change to "claude-opus-4-6" for deeper analysis
CLAUDE_MODEL = "claude-sonnet-4-6"


# ═══════════════════════════════════════════════════════════════════════════
# DATA FETCHING
# ═══════════════════════════════════════════════════════════════════════════

def fetch_market_data(ticker, yf_ticker=None):
    """Fetch price, 52-week range, P/E, analyst targets, 1mo/3mo performance."""
    symbol = yf_ticker or ticker
    stock = yf.Ticker(symbol)
    info = stock.info or {}

    price = (
        info.get("currentPrice")
        or info.get("regularMarketPrice")
        or info.get("navPrice")
        or info.get("previousClose")
    )

    hist = stock.history(period="3mo")
    perf_1mo = None
    perf_3mo = None

    if len(hist) >= 2:
        current = hist["Close"].iloc[-1]
        if price is None:
            price = float(current)
        if len(hist) >= 21:
            perf_1mo = ((current - hist["Close"].iloc[-21]) / hist["Close"].iloc[-21]) * 100
        if len(hist) >= 63:
            perf_3mo = ((current - hist["Close"].iloc[0]) / hist["Close"].iloc[0]) * 100
        else:
            perf_3mo = ((current - hist["Close"].iloc[0]) / hist["Close"].iloc[0]) * 100

    return {
        "price": round(price, 2) if price else None,
        "high_52w": info.get("fiftyTwoWeekHigh"),
        "low_52w": info.get("fiftyTwoWeekLow"),
        "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
        "target_mean": info.get("targetMeanPrice"),
        "target_low": info.get("targetLowPrice"),
        "target_high": info.get("targetHighPrice"),
        "analyst_recommendation": info.get("recommendationKey"),
        "perf_1mo_pct": round(perf_1mo, 2) if perf_1mo is not None else None,
        "perf_3mo_pct": round(perf_3mo, 2) if perf_3mo is not None else None,
    }


def build_portfolio_summary():
    """Fetch data for all holdings and compute portfolio-level metrics."""
    print("Fetching market data...")
    positions = []
    total_value = 0
    total_cost = 0

    for ticker, holding in PORTFOLIO.items():
        print(f"  {ticker}...", end=" ", flush=True)

        if holding.get("skip_analysis"):
            # Money market — just count the value, skip Yahoo fetch
            value = holding["shares"] * holding["avg_cost"]
            total_value += value
            total_cost += value
            positions.append({
                "ticker": ticker,
                "shares": holding["shares"],
                "current_price": holding["avg_cost"],
                "market_value": round(value, 2),
                "gain_loss": 0,
                "gain_pct": 0,
                "account": holding["account"],
                "note": "Money market fund — cash equivalent",
            })
            print(f"${holding['avg_cost']:.2f} (cash)")
            continue

        try:
            data = fetch_market_data(ticker, holding.get("yf_ticker"))
            price = data["price"]
            if price is None:
                print("SKIPPED (no price data)")
                continue

            market_value = price * holding["shares"]
            cost_basis = holding["avg_cost"] * holding["shares"]
            gain_loss = market_value - cost_basis
            gain_pct = (gain_loss / cost_basis) * 100 if cost_basis else 0

            total_value += market_value
            total_cost += cost_basis

            pos = {
                "ticker": ticker,
                "name": holding.get("name", ticker),
                "shares": holding["shares"],
                "avg_cost": holding["avg_cost"],
                "current_price": price,
                "market_value": round(market_value, 2),
                "cost_basis": round(cost_basis, 2),
                "gain_loss": round(gain_loss, 2),
                "gain_pct": round(gain_pct, 2),
                "account": holding["account"],
            }
            # Merge in market data (skip None values to keep JSON clean)
            for k, v in data.items():
                if v is not None and k != "price":
                    pos[k] = round(v, 2) if isinstance(v, float) else v

            positions.append(pos)
            print(f"${price:.2f}")

        except Exception as e:
            print(f"ERROR — {e}")

    # Calculate portfolio weights
    for pos in positions:
        pos["weight_pct"] = round((pos["market_value"] / total_value) * 100, 2) if total_value else 0

    return {
        "date": datetime.date.today().isoformat(),
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "total_gain_loss": round(total_value - total_cost, 2),
        "total_gain_pct": round(((total_value - total_cost) / total_cost) * 100, 2) if total_cost else 0,
        "positions": positions,
        "recurring_investments": RECURRING,
    }


# ═══════════════════════════════════════════════════════════════════════════
# CLAUDE ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """\
You are a sharp, no-BS investment analyst reviewing a personal brokerage + \
retirement portfolio. You are direct, data-driven, and concise.

Given the portfolio JSON, provide:

1. **Portfolio Overview** — Total value, overall P&L, concentration risks, \
asset-class breakdown.
2. **Per-Position Analysis** — For each non-cash holding give a \
**BUY / SELL / HOLD** rating with:
   - Current price vs 52-week range and analyst targets
   - Recent momentum (1-month / 3-month performance)
   - Position sizing — over/underweight?
   - 2-3 sentence rationale
3. **Recurring Investment Check** — Are the DCA amounts and frequencies \
well-allocated given current valuations and weights?
4. **Action Items** — Top 3 concrete, specific things to consider this week.

Keep it concise and actionable. No jargon soup. Format as clean markdown.\
"""


def get_claude_analysis(summary):
    """Send portfolio data to Claude and return the analysis."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        sys.exit("Set ANTHROPIC_API_KEY environment variable.")

    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": (
                f"Here is my portfolio as of {summary['date']}:\n\n"
                f"```json\n{json.dumps(summary, indent=2)}\n```\n\n"
                "Analyze each position and give me BUY/SELL/HOLD recommendations."
            ),
        }],
    )

    return message.content[0].text


# ═══════════════════════════════════════════════════════════════════════════
# DELIVERY
# ═══════════════════════════════════════════════════════════════════════════

def save_local(report, summary):
    """Save report to a markdown file next to this script."""
    date = summary["date"]
    out_dir = Path(__file__).parent / "reports"
    out_dir.mkdir(exist_ok=True)
    path = out_dir / f"portfolio_report_{date}.md"

    header = (
        f"# Portfolio Report — {date}\n"
        f"**Total Value:** ${summary['total_value']:,.2f}  \n"
        f"**Total Gain/Loss:** ${summary['total_gain_loss']:+,.2f} "
        f"({summary['total_gain_pct']:+.2f}%)\n\n---\n\n"
    )
    path.write_text(header + report, encoding="utf-8")
    print(f"  Saved → {path}")
    return path


def deliver_email(report, summary):
    """Send report via SMTP email."""
    date = summary["date"]
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Portfolio Report — {date}"
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO
    msg.attach(MIMEText(report, "plain"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(EMAIL_FROM, EMAIL_TO, msg.as_string())
    print("  Email sent.")


def deliver_slack(report, summary):
    """Post report to a Slack channel via incoming webhook."""
    import urllib.request

    # Slack truncates at 40k chars — trim if needed
    text = f"*Portfolio Report — {summary['date']}*\n\n{report}"
    if len(text) > 39000:
        text = text[:39000] + "\n\n_(truncated)_"

    req = urllib.request.Request(
        SLACK_WEBHOOK_URL,
        data=json.dumps({"text": text}).encode(),
        headers={"Content-Type": "application/json"},
    )
    urllib.request.urlopen(req)
    print("  Slack message sent.")


def deliver_notion(report, summary):
    """Create a page in a Notion database with the report."""
    import urllib.request

    date = summary["date"]
    # Notion blocks have a 2000-char limit per rich_text element.
    # Split the report into chunks.
    chunks = [report[i:i + 1900] for i in range(0, len(report), 1900)]
    children = [
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"type": "text", "text": {"content": chunk}}],
            },
        }
        for chunk in chunks
    ]

    payload = json.dumps({
        "parent": {"database_id": NOTION_DATABASE_ID},
        "properties": {
            "Name": {"title": [{"text": {"content": f"Portfolio Report — {date}"}}]},
            "Date": {"date": {"start": date}},
        },
        "children": children,
    })

    req = urllib.request.Request(
        "https://api.notion.com/v1/pages",
        data=payload.encode(),
        headers={
            "Authorization": f"Bearer {NOTION_API_KEY}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
        },
    )
    urllib.request.urlopen(req)
    print("  Notion page created.")


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print(f"═══ Portfolio Agent — {datetime.date.today()} ═══\n")

    # 1. Fetch live market data and build summary
    summary = build_portfolio_summary()
    print(f"\n  Total value:     ${summary['total_value']:>12,.2f}")
    print(f"  Total cost:      ${summary['total_cost']:>12,.2f}")
    print(f"  Gain/Loss:       ${summary['total_gain_loss']:>+12,.2f} ({summary['total_gain_pct']:+.2f}%)\n")

    # 2. Send to Claude for analysis
    print("Sending to Claude for analysis...")
    report = get_claude_analysis(summary)
    print("\n" + "─" * 60)
    print(report)
    print("─" * 60 + "\n")

    # 3. Deliver
    print("Delivering report...")
    if SAVE_LOCAL:
        save_local(report, summary)
    if SEND_EMAIL:
        try:
            deliver_email(report, summary)
        except Exception as e:
            print(f"  Email FAILED: {e}")
    if SEND_SLACK:
        try:
            deliver_slack(report, summary)
        except Exception as e:
            print(f"  Slack FAILED: {e}")
    if POST_NOTION:
        try:
            deliver_notion(report, summary)
        except Exception as e:
            print(f"  Notion FAILED: {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
