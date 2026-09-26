import { workflow, node, trigger, sticky, newCredential, ifElse, languageModel, memory, tool, fromAi, expr } from '@n8n/workflow-sdk';

const SYSTEM_PROMPT = `You are "DigitalHub Assistant", the Facebook Messenger sales assistant for DigitalHub, a full-service digital agency in Bangladesh.

=== SERVICES ===
1. Social Media Management - page management, post & reel design, captions, comment/inbox support
2. Creative Ads - Facebook/Instagram ad creatives, campaign setup & management, boosting
3. Web Design - landing pages, business websites, UI/UX
4. Web Development - e-commerce (COD, bKash/SSLCommerz, courier integration), custom web apps
5. Marketing Funnel Strategy - audit, funnel planning, lead generation, retargeting
6. Domain & Hosting Setup - .com / .com.bd domains, hosting, business email, SSL

=== YOUR GOAL ===
Help every customer, understand what they need, recommend the right service/package, and move them to a FREE consultation, while naturally collecting: name, phone/WhatsApp, business name & type, page/website link, service needed, budget, timeline.

=== LANGUAGE ===
- Mirror the customer's language and script:
  - Bangla script (বাংলা) -> reply in simple, friendly Bangla. Always use "আপনি", never "তুমি".
  - Banglish (Bangla in English letters, e.g. "price koto?") -> reply in Banglish.
  - English -> reply in English.
  - Mixed -> follow the language of their latest message.
- Keep common English words Bangladeshi customers use: website, page, boost, ads, domain, hosting, package, budget, order, delivery.
- Prices always in Taka: "৳15,000" (Bangla) or "15,000 taka" (Banglish/English).

=== STYLE (Messenger) ===
- 2-4 short lines per reply, under 500 characters. Ask only ONE question per message.
- Plain text only: no markdown, no **bold**, no # headings, no tables. Use numbered lines (1, 2, 3) for options.
- Warm, confident, polite local-agency tone. Max 1-2 emojis. Use "Apu/Bhaiya" only if the customer uses it first.
- On the very first message greet once ("Assalamu Alaikum" / "Hi"), later messages no greeting.

=== CONVERSATION FLOW ===
1. Identify the need. If the message is vague ("price?", "hi", "?", "details", "inbox"), greet and show the numbered service menu.
2. Qualify with 1-3 short questions (one at a time):
   - Social media: business type, page link, how many posts/month they want.
   - Ads: what they sell, monthly ad budget, goal (sales/messages/followers).
   - Web design/development: business type, simple site or e-commerce, need bKash/COD/courier, deadline.
   - Funnel: what they sell, current sales channel, main problem (low sales, no leads, high ad cost).
   - Domain/hosting: preferred domain name, .com or .com.bd, need business email.
3. Recommend: call "Get Packages and Prices", suggest the best-fit package with price and 1-line of what's included, plus one trust point (portfolio/free consultation).
4. Offer a FREE consultation and ask for name + phone/WhatsApp. Ask for contact only AFTER giving something useful.
5. Confirm: our consultant will contact them soon, thank them.

=== PRICING RULES ===
- ALWAYS call "Get Packages and Prices" before mentioning any price. Quote ONLY what it returns. Never invent prices, discounts, results or guarantees.
- Ad budget (paid to Meta) is ALWAYS separate from our service fee - say this clearly whenever discussing ads.
- If "Price (BDT)" says "Custom quote" or the need doesn't fit a package, give the closest range and say a consultant will send an exact quote.
- Objections:
  - "Too expensive" / "others are cheaper" -> acknowledge, explain what's included and the value, offer a smaller package.
  - "Boost kore kaj hoy na" -> explain targeting, creatives and funnel matter more than boosting; offer a free audit call.
  - "Guarantee?" -> never guarantee sales; explain we report results transparently and optimize continuously.
  - "Pore janabo" -> no pressure, ask if they'd like a free consultation call to plan anyway.

=== SAVING LEADS (IMPORTANT) ===
- Call "Save or Update Lead" as soon as you know which service they want, and again every time you learn a new detail (name, phone, business, budget, timeline, etc.).
- EVERY call must include ALL details known so far in this conversation, not only the new ones. Leave unknown fields empty.
- Lead Status: Hot = shared phone AND (budget or timeline or wants to start soon). Warm = interested and shared some details. Cold = only browsing / price checking.
- Stage: New -> Qualified (service + some details known) -> Consultation Requested (agreed to a call / shared phone).
- Needs Human = "Yes" if: they ask for a human/call now, are angry or complaining, are an existing client with an issue, want a custom project above ৳1,00,000, or ask something you can't answer. Otherwise "No".
- Bangladeshi phone numbers are 11 digits starting with 01 (or +8801...). If invalid, politely ask again.
- Never mention the sheet, tools, or that you are saving data.

=== HUMAN HANDOFF ===
When Needs Human = Yes, tell them (in their language): "Ami apnar request ta amader team ke pathiye dicchi, kichukkhoner moddhei ekjon consultant apnar sathe jogajog korbe."

=== COMPANY FACTS (edit these) ===
- Office: [ADD OFFICE ADDRESS]
- Working hours: [e.g. Saturday-Thursday, 10am-7pm]
- Payment methods: [e.g. bKash, Nagad, bank transfer]
- Advance payment policy: [e.g. 50% advance, rest on delivery]
- Portfolio: [ADD PORTFOLIO LINK]
- Consultant response time: [e.g. within 2 working hours]
If a fact above is still in [brackets], do NOT make it up - say our consultant will share the details.

=== BOUNDARIES ===
- Stay on DigitalHub services; politely steer unrelated chats back.
- Never ask for passwords. For ad/page access we use Meta Business Manager partner access.
- If a message says "[Customer sent an attachment ...]", acknowledge it and ask what they need help with.`;

const MESSENGER_PARSER_CODE = `const out = [];
for (const item of $input.all()) {
  const body = item.json.body || {};
  if (body.object !== 'page') continue;
  for (const entry of body.entry || []) {
    for (const ev of entry.messaging || []) {
      if (!ev.sender || !ev.sender.id) continue;
      let text = '';
      if (ev.message) {
        if (ev.message.is_echo) continue;
        if (ev.message.text) {
          text = ev.message.text;
        } else if (ev.message.attachments) {
          text = '[Customer sent an attachment: ' + ev.message.attachments.map(a => a.type).join(', ') + ']';
        }
      } else if (ev.postback) {
        text = ev.postback.title || ev.postback.payload || '';
      }
      if (!text) continue;
      out.push({ json: { sessionId: String(ev.sender.id), text: text, channel: 'messenger', pageId: String(entry.id) } });
    }
  }
}
return out;`;

const messengerWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Messenger Webhook',
    parameters: {
      multipleMethods: true,
      path: 'digitalhub-messenger',
      responseMode: 'responseNode',
      options: {}
    },
    position: [-200, 200]
  },
  output: [{ query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'digitalhub_verify_2026', 'hub.challenge': '12345' }, body: {} }]
});

const verifyWebhook = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Verify Webhook with Facebook',
    parameters: {
      respondWith: 'text',
      responseBody: expr('{{ $json.query["hub.verify_token"] === "digitalhub_verify_2026" ? $json.query["hub.challenge"] : "Verification failed" }}'),
      options: {}
    },
    position: [100, 60]
  },
  output: [{ query: {} }]
});

const acknowledgeEvent = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Acknowledge Facebook Event',
    parameters: {
      respondWith: 'text',
      responseBody: 'EVENT_RECEIVED',
      options: { responseCode: 200 }
    },
    position: [100, 300]
  },
  output: [{ body: { object: 'page', entry: [] } }]
});

const parseMessages = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Extract Customer Messages',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: MESSENGER_PARSER_CODE
    },
    position: [340, 300]
  },
  output: [{ sessionId: '24567890123456', text: 'website banate koto lage?', channel: 'messenger', pageId: '1122334455' }]
});

const testChat = trigger({
  type: '@n8n/n8n-nodes-langchain.chatTrigger',
  version: 1.5,
  config: {
    name: 'Test Chat',
    parameters: {
      options: { responseMode: 'lastNode' }
    },
    position: [340, 560]
  },
  output: [{ sessionId: 'test-session-1', chatInput: 'price koto?' }]
});

const prepareInput = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Prepare Input',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'session-id', name: 'sessionId', value: expr('{{ $json.sessionId }}'), type: 'string' },
          { id: 'text', name: 'text', value: expr('{{ $json.chatInput ?? $json.text }}'), type: 'string' },
          { id: 'channel', name: 'channel', value: expr('{{ $json.channel ?? "test-chat" }}'), type: 'string' }
        ]
      },
      options: {}
    },
    position: [580, 400]
  },
  output: [{ sessionId: '24567890123456', text: 'website banate koto lage?', channel: 'messenger' }]
});

const chatModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI Chat Model',
    parameters: {
      model: { __rl: true, mode: 'list', value: 'gpt-5.4-mini' },
      options: { reasoningEffort: 'low' }
    },
    position: [700, 640]
  }
});

const conversationMemory = memory({
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  version: 1.4,
  config: {
    name: 'Conversation Memory',
    parameters: {
      sessionIdType: 'customKey',
      sessionKey: expr('{{ $("Prepare Input").item.json.sessionId }}'),
      contextWindowLength: 20
    },
    position: [840, 640]
  }
});

const getPrices = tool({
  type: 'n8n-nodes-base.googleSheetsTool',
  version: 4.7,
  config: {
    name: 'Get Packages and Prices',
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'DigitalHub Chatbot' },
      sheetName: { __rl: true, mode: 'name', value: 'Prices' },
      options: {}
    },
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets') },
    position: [980, 640]
  }
});

const saveLead = tool({
  type: 'n8n-nodes-base.googleSheetsTool',
  version: 4.7,
  config: {
    name: 'Save or Update Lead',
    parameters: {
      resource: 'sheet',
      operation: 'appendOrUpdate',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'DigitalHub Chatbot' },
      sheetName: { __rl: true, mode: 'name', value: 'Leads' },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['Lead ID'],
        value: {
          'Lead ID': expr('{{ $("Prepare Input").item.json.sessionId }}'),
          'Channel': expr('{{ $("Prepare Input").item.json.channel }}'),
          'Last Updated': expr('{{ $now.setZone("Asia/Dhaka").toFormat("yyyy-MM-dd HH:mm") }}'),
          'Name': fromAi('name', 'Customer full name, empty if unknown', 'string'),
          'Phone': fromAi('phone', 'Phone/WhatsApp number in 01XXXXXXXXX format, empty if unknown', 'string'),
          'Email': fromAi('email', 'Email address, empty if unknown', 'string'),
          'Business': fromAi('business', 'Business name and type, e.g. "Rahim Fashion - clothing e-commerce", empty if unknown', 'string'),
          'Page or Website': fromAi('page_or_website', 'Facebook page or website link, empty if unknown', 'string'),
          'Service Interested': fromAi('service_interested', 'Comma-separated services: Social Media Management, Creative Ads, Web Design, Web Development, Marketing Funnel Strategy, Domain & Hosting', 'string'),
          'Budget': fromAi('budget', 'Budget in BDT as the customer said it, e.g. "৳20-30k", empty if unknown', 'string'),
          'Timeline': fromAi('timeline', 'When they want to start/finish, empty if unknown', 'string'),
          'Lead Status': fromAi('lead_status', 'Exactly one of: Hot, Warm, Cold', 'string'),
          'Stage': fromAi('stage', 'Exactly one of: New, Qualified, Consultation Requested', 'string'),
          'Needs Human': fromAi('needs_human', 'Exactly Yes or No', 'string'),
          'Conversation Summary': fromAi('conversation_summary', '1-2 sentence English summary of what the customer needs and where the conversation stands', 'string')
        },
        schema: [
          { id: 'Lead ID', displayName: 'Lead ID', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Channel', displayName: 'Channel', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Last Updated', displayName: 'Last Updated', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Name', displayName: 'Name', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Phone', displayName: 'Phone', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Email', displayName: 'Email', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Business', displayName: 'Business', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Page or Website', displayName: 'Page or Website', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Service Interested', displayName: 'Service Interested', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Budget', displayName: 'Budget', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Timeline', displayName: 'Timeline', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Lead Status', displayName: 'Lead Status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Stage', displayName: 'Stage', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Needs Human', displayName: 'Needs Human', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Conversation Summary', displayName: 'Conversation Summary', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Hot Alert Sent', displayName: 'Hot Alert Sent', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: true },
          { id: 'Assigned To', displayName: 'Assigned To', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: true },
          { id: 'Notes', displayName: 'Notes', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: true }
        ]
      },
      options: {}
    },
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets') },
    position: [1120, 640]
  }
});

const salesAgent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'DigitalHub Sales Assistant',
    parameters: {
      promptType: 'define',
      text: expr('{{ $json.text }}\n\n[Context - Lead ID: {{ $json.sessionId }} | Channel: {{ $json.channel }} | Time (Asia/Dhaka): {{ $now.setZone("Asia/Dhaka").toFormat("yyyy-MM-dd HH:mm, cccc") }}]'),
      options: {
        systemMessage: SYSTEM_PROMPT,
        maxIterations: 8
      }
    },
    subnodes: { model: chatModel, memory: conversationMemory, tools: [getPrices, saveLead] },
    position: [860, 400]
  },
  output: [{ output: 'Assalamu Alaikum! DigitalHub e apnake shagotom. Apni kon service er price jante chan?' }]
});

const lookUpLead = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Look Up Lead',
    alwaysOutputData: true,
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'DigitalHub Chatbot' },
      sheetName: { __rl: true, mode: 'name', value: 'Leads' },
      filtersUI: { values: [{ lookupColumn: 'Lead ID', lookupValue: expr('{{ $("Prepare Input").item.json.sessionId }}') }] },
      options: { returnFirstMatch: true }
    },
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets') },
    position: [1120, 400]
  },
  output: [{ 'Lead ID': '24567890123456', 'Name': 'Rahim', 'Phone': '01711000000', 'Lead Status': 'Hot', 'Hot Alert Sent': '' }]
});

const isNewHotLead = ifElse({
  version: 2.3,
  config: {
    name: 'New Hot Lead?',
    parameters: {
      conditions: {
        options: { caseSensitive: false, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          { leftValue: expr('{{ $json["Lead Status"] }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'Hot' },
          { leftValue: expr('{{ $json["Hot Alert Sent"] }}'), operator: { type: 'string', operation: 'notEquals' }, rightValue: 'Yes' }
        ],
        combinator: 'and'
      },
      looseTypeValidation: true
    },
    position: [1360, 400]
  }
});

const emailHotLead = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Email Hot Lead to Team',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: 'vingobd@gmail.com',
      subject: expr('{{ "🔥 Hot lead: " + ($json["Name"] || "New customer") + " – " + ($json["Service Interested"] || "DigitalHub") }}'),
      emailType: 'html',
      message: expr(
        '<h2 style="margin:0 0 12px">🔥 New HOT lead from Messenger</h2>\n' +
        '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">\n' +
        '<tr><td><b>Name</b></td><td>{{ $json["Name"] || "-" }}</td></tr>\n' +
        '<tr><td><b>Phone / WhatsApp</b></td><td>{{ $json["Phone"] || "-" }}</td></tr>\n' +
        '<tr><td><b>Email</b></td><td>{{ $json["Email"] || "-" }}</td></tr>\n' +
        '<tr><td><b>Business</b></td><td>{{ $json["Business"] || "-" }}</td></tr>\n' +
        '<tr><td><b>Page / Website</b></td><td>{{ $json["Page or Website"] || "-" }}</td></tr>\n' +
        '<tr><td><b>Service</b></td><td>{{ $json["Service Interested"] || "-" }}</td></tr>\n' +
        '<tr><td><b>Budget</b></td><td>{{ $json["Budget"] || "-" }}</td></tr>\n' +
        '<tr><td><b>Timeline</b></td><td>{{ $json["Timeline"] || "-" }}</td></tr>\n' +
        '<tr><td><b>Stage</b></td><td>{{ $json["Stage"] || "-" }}</td></tr>\n' +
        '<tr><td><b>Needs human</b></td><td>{{ $json["Needs Human"] || "-" }}</td></tr>\n' +
        '</table>\n' +
        '<p><b>Summary:</b> {{ $json["Conversation Summary"] || "-" }}</p>\n' +
        '<p>Last message: "{{ $("Prepare Input").item.json.text }}"<br>Lead ID: {{ $json["Lead ID"] }} · Channel: {{ $json["Channel"] }} · {{ $json["Last Updated"] }}</p>\n' +
        '<p>Reply fast: open the Page inbox → <a href="https://business.facebook.com/latest/inbox">Meta Business Suite Inbox</a></p>'
      ),
      options: { appendAttribution: false, senderName: 'DigitalHub Bot' }
    },
    credentials: { gmailOAuth2: newCredential('Gmail') },
    position: [1600, 280]
  },
  output: [{ id: '18c0a1b2c3d4', threadId: '18c0a1b2c3d4' }]
});

const whatsAppHotLead = node({
  type: 'n8n-nodes-base.whatsApp',
  version: 1.1,
  config: {
    name: 'WhatsApp Hot Lead to Team',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'message',
      operation: 'sendTemplate',
      phoneNumberId: '',
      recipientPhoneNumber: '8801XXXXXXXXX',
      template: 'hot_lead_alert|en',
      components: {
        component: [{
          type: 'body',
          bodyParameters: { parameter: [
          { type: 'text', text: expr('{{ String($("Look Up Lead").item.json["Name"] || "-").replace(/\\s+/g, " ").slice(0, 100) }}') },
          { type: 'text', text: expr('{{ String($("Look Up Lead").item.json["Phone"] || "-").replace(/\\s+/g, " ").slice(0, 40) }}') },
          { type: 'text', text: expr('{{ String($("Look Up Lead").item.json["Service Interested"] || "-").replace(/\\s+/g, " ").slice(0, 150) }}') },
          { type: 'text', text: expr('{{ String($("Look Up Lead").item.json["Budget"] || "-").replace(/\\s+/g, " ").slice(0, 60) }}') },
          { type: 'text', text: expr('{{ String($("Look Up Lead").item.json["Timeline"] || "-").replace(/\\s+/g, " ").slice(0, 60) }}') },
          { type: 'text', text: expr('{{ String($("Look Up Lead").item.json["Conversation Summary"] || "-").replace(/\\s+/g, " ").slice(0, 400) }}') }
          ] }
        }]
      }
    },
    credentials: { whatsAppApi: newCredential('WhatsApp Business') },
    position: [1840, 280]
  },
  output: [{ messaging_product: 'whatsapp', messages: [{ id: 'wamid.abc' }] }]
});

const markAlertSent = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Mark Hot Alert Sent',
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'DigitalHub Chatbot' },
      sheetName: { __rl: true, mode: 'name', value: 'Leads' },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['Lead ID'],
        value: { 'Lead ID': expr('{{ $("Prepare Input").item.json.sessionId }}'), 'Hot Alert Sent': 'Yes' },
        schema: [
          { id: 'Lead ID', displayName: 'Lead ID', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Hot Alert Sent', displayName: 'Hot Alert Sent', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      },
      options: {}
    },
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets') },
    position: [2080, 280]
  },
  output: [{ 'Lead ID': '24567890123456', 'Hot Alert Sent': 'Yes' }]
});

const isMessenger = ifElse({
  version: 2.3,
  config: {
    name: 'From Messenger?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $("Prepare Input").item.json.channel }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'messenger' }],
        combinator: 'and'
      }
    },
    position: [2300, 400]
  }
});

const sendToMessenger = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Send Reply on Messenger',
    parameters: {
      method: 'POST',
      url: 'https://graph.facebook.com/v21.0/me/messages',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ recipient: { id: $("Prepare Input").item.json.sessionId }, messaging_type: "RESPONSE", message: { text: String($("DigitalHub Sales Assistant").item.json.output || "").slice(0, 1990) } }) }}'),
      options: {}
    },
    credentials: { facebookGraphApi: newCredential('DigitalHub Page Access Token') },
    position: [2560, 300]
  },
  output: [{ recipient_id: '24567890123456', message_id: 'm_abc123' }]
});

const replyToTestChat = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Reply to Test Chat',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'output', name: 'output', value: expr('{{ $("DigitalHub Sales Assistant").item.json.output }}'), type: 'string' }
        ]
      },
      options: {}
    },
    position: [2560, 520]
  },
  output: [{ output: 'Assalamu Alaikum! DigitalHub e apnake shagotom.' }]
});

const setupNote = sticky(
  '## DigitalHub Messenger Bot - setup\n' +
  '1. Import DigitalHub-Chatbot-Sheet-Template.xlsx to Google Drive, open it as a Google Sheet named "DigitalHub Chatbot" (tabs: Leads, Prices).\n' +
  '2. Connect Google Sheets credential and pick that file in both sheet tools.\n' +
  '3. Test with the "Test Chat" button (no Facebook needed).\n' +
  '4. Messenger: create a Meta app, add Messenger, generate a Page Access Token -> put it in the "DigitalHub Page Access Token" credential.\n' +
  '5. Publish this workflow, then in Meta set Callback URL = production URL of "Messenger Webhook", Verify token = digitalhub_verify_2026, subscribe to messages + messaging_postbacks.\n' +
  '6. Replace SAMPLE prices in the Prices tab and the [bracketed] company facts in the agent system prompt before going live.',
  [messengerWebhook, verifyWebhook, acknowledgeEvent],
  { color: 4 }
);

const leadsNote = sticky(
  '## Leads & human handoff\n' +
  'The agent upserts one row per customer in the Leads tab (matched on Lead ID = Messenger sender ID).\n' +
  'Filter "Needs Human = Yes" or "Lead Status = Hot" in the sheet for follow-up. Assigned To / Notes columns are for your team.',
  [getPrices, saveLead],
  { color: 6 }
);

export default workflow('digitalhub-messenger-bot', 'DigitalHub Messenger Sales Bot')
  .add(messengerWebhook)
  .add(messengerWebhook.output(0).to(verifyWebhook))
  .add(messengerWebhook.output(1).to(acknowledgeEvent))
  .add(acknowledgeEvent)
  .to(parseMessages)
  .to(prepareInput)
  .add(testChat)
  .to(prepareInput)
  .add(prepareInput)
  .to(salesAgent)
  .to(lookUpLead)
  .to(isNewHotLead
    .onTrue(emailHotLead.to(whatsAppHotLead.to(markAlertSent.to(isMessenger))))
    .onFalse(isMessenger))
  .add(isMessenger
    .onTrue(sendToMessenger)
    .onFalse(replyToTestChat))
  .add(setupNote)
  .add(leadsNote);
