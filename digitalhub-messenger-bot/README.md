# DigitalHub Messenger Sales Bot (n8n)

AI chatbot that answers DigitalHub's Facebook Messenger inbox in Bangla, Banglish and English, quotes packages from a Google Sheet, and saves every lead to Google Sheets.

- n8n workflow: **DigitalHub Messenger Sales Bot** (`60VYfzPJEAjMFZpw`)
- `workflow.sdk.ts`: the workflow source (n8n Workflow SDK), including the full system prompt
- `DigitalHub-Chatbot-Sheet-Template.xlsx`: Google Sheet template with a `Leads` tab and a `Prices` tab (the prices are **SAMPLE** values)

## How it works

```
Messenger Webhook ─GET─> Verify Webhook with Facebook
                  └POST─> Acknowledge (200) -> Extract Customer Messages ─┐
Test Chat (n8n) ──────────────────────────────────────────────────────────┴> Prepare Input
  -> DigitalHub Sales Assistant (AI Agent + memory per customer)
       tools: Get Packages and Prices (Prices tab), Save or Update Lead (Leads tab, upsert on Lead ID)
  -> From Messenger? ─yes─> Send Reply on Messenger (Graph API /me/messages)
                     └no──> Reply to Test Chat
```

## Setup

1. **Google Sheet:** upload `DigitalHub-Chatbot-Sheet-Template.xlsx` to Google Drive, open it with Google Sheets, then use *File → Save as Google Sheets*. Name it `DigitalHub Chatbot`.
2. **n8n:** connect a Google Sheets credential. In both **Get Packages and Prices** and **Save or Update Lead**, choose that spreadsheet.
3. **Test:** click *Open chat* in the workflow and try messages like `price koto?`, `ওয়েবসাইট বানাতে কত লাগবে?` or `I need FB ads for my clothing page`. Check that rows appear in the Leads tab.
4. **Messenger:**
   - Create a Meta app at developers.facebook.com and add the Messenger product.
   - Connect the DigitalHub Page and generate a Page Access Token.
   - In n8n, create a *Facebook Graph API* credential named `DigitalHub Page Access Token` and paste the token into it.
   - Publish the workflow. In the Meta webhook settings, set:
     - Callback URL: the production URL of the **Messenger Webhook** node
     - Verify token: `digitalhub_verify_2026`
   - Subscribe the webhook to `messages` and `messaging_postbacks`.
5. **Before going live:**
   - Replace the SAMPLE prices in the Prices tab.
   - Fill in the `[bracketed]` company facts at the end of the agent's system message.
   - Change the verify token if you like. It appears in the Verify node and in the Meta settings, so update both.

## Notes

- **Facebook's 24-hour rule:** the bot replies with `messaging_type: RESPONSE`, which only works within 24 hours of the customer's last message.
- **Memory:** the bot uses n8n Simple Memory, which keeps the last 20 messages per customer. It resets if n8n restarts. Swap it for Postgres/Redis memory if you need long-term history.
- **Human handoff:** the bot marks `Needs Human = Yes` in the sheet. Filter on that (or on `Lead Status = Hot`) for follow-up. You can add a Telegram or email alert later.
