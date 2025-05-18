Prompt-Generation Specification  
================================

Goal  
Produce eight concise, high-signal paragraphs (≈ 40–70 words) for every Persona and PMF-tier “scope”.  
Each paragraph is built from a fixed set of interview fields so we know exactly what to fetch and pass to the LLM.

Folder layout
-------------
/prompts  
 persona/                        # templates used when view_scope = 'persona'  
  who.md  
  discovery.md  
  expectations.md  
  …  
 pmf/                            # templates for PMF-tier summaries  
  who.md … roadmap.md  

Common placeholder names
------------------------
• {{segmentLabel}}   Founder, Growth PM, “Very disappointed” …  
• {{interviewCount}} integer – number of interviews in the 100-row window  
• {{sourceLines}}    JSON array of {text,signal} objects (max 15)  
• {{characteristics}}comma-separated adjectives – e.g. “budget-tight, time-strapped”  
• {{featureCounts}}  JSON object { "hosting":12, "clip editor":9 } (requests / roadmap)  
• {{sentimentMix}}   JSON {positive:18,neutral:9,negative:4} (value & friction sections)  
• {{organisationDescription}}  – profiles.organisation_description (roadmap section only)

Mapping: section → inputs
-------------------------
1. who  
   Field keys: persona_title, persona_company_type, persona_context  
   Meta: characteristics_json  
   Extras: {{segmentLabel}}, {{interviewCount}}, {{characteristics}}  

2. discovery  
   Field keys: acquisition, decisionTrigger  
   Extras: {{sourceLines}}, {{interviewCount}}  

3. expectations  
   Field keys: activation  
   Extras: {{sourceLines}}, {{interviewCount}}  

4. value  
   Field keys: benefit, firstValue, jtbd  
   Extras: {{sentimentMix}}, {{sourceLines}}  

5. friction  
   Field keys: gap, preToolPain  
   Extras: {{sentimentMix}}, {{sourceLines}}  

6. requests  
   Field keys: suggestions  
   Array items: featureSignals (dedup & count)  
   Extras: {{featureCounts}}, {{sourceLines}}  

7. positioning  
   Field keys: alternativeTool, valueVoice, idealUserVoice  
   Extras: {{sourceLines}}, {{interviewCount}}  

8. roadmap  
   Built entirely from Section-6 material but aggregated:  
     • Ranked array from buildRankedJson() -> {{rankedTable}}  
     • Organisation pitch -> {{organisationDescription}}  

Template example (persona/who.md)
---------------------------------
```md
Write a concise 40-70-word profile of the typical **{{segmentLabel}}** user
based on {{interviewCount}} recent interviews.

Use these reference snippets (high-signal first):
{{#each sourceLines}}
– ({{signal}}) {{text}}
{{/each}}

Highlight role, company type, and working context.  Mention up to three
characteristics: {{characteristics}}.  Do not add projections or marketing
spin; stick to the evidence.
```

Template example (pmf/roadmap.md)
---------------------------------
```md
You are writing an internal product roadmap note.

Context: our company description — {{organisationDescription}}

User segment: **{{segmentLabel}}** ({{interviewCount}} interviews).

Top requested improvements with counts and signal strength:
{{rankedTable}}                     <!-- JSON array already sorted -->

Write a 60-word narrative explaining why the first two items are urgent and how
they relate to churn risk.  End with a 1-sentence rallying call.
```

Helper rules for building input objects
---------------------------------------
buildPromptInput(section, rows, arrays, metas, scope):

1. Select only rows whose `field_key` matches the mapping table above.  
2. Deduplicate by `distilled_text`; keep the highest `signal`.  
3. Sort by `signal DESC`, `updated_at DESC`, take top 15.  
4. Convert to array of `{ text, signal }` ⇒ `sourceLines`.  
5. For sentimentMix: count `chat_responses.sentiment` values.  
6. For featureCounts:  
   `SELECT value, COUNT(*) FROM response_array_items  
    WHERE array_key='featureSignals' AND response_id IN ids GROUP BY value;`

buildRankedJson(fields, metas):

• GROUP BY suggestions.distilled_text  
• mentions  = COUNT(*)  
• avgSignal = numeric average (high=3,med=2,low=1 → back to text)  
• quick-win = avgSignal='high' AND mentions≥3  
• churn-saver = same text appears as `gap` in ≥2 churn interviews  
Return sorted array; worker stores it in `section_outputs.ranked_json`.

Token budget guideline
----------------------
• Source lines: ≤ 15 × ~15 words = 225 tokens  
• Prompt template: 100 tokens  
• Completion: 80 tokens  
Total ≈ 400 tokens / call, safely under GPT-4o 8K window.

How to add a new section later
------------------------------
1. Draft template md file in both /persona and /pmf.  
2. Extend mapping table with field_keys and extras.  
3. Add id to `ALL_SECTIONS` array so the worker processes it.  
4. Bump `modelVersion` string.

Deliverables for prompt work
----------------------------
✔ / prompts / persona / *.md (8 files)  
✔ / prompts / pmf / *.md (8 files)  
✔ `prompt-input-mapping.ts` – exports section → input metadata  
✔ `fillTemplate(section, scopeType, data)` helper util.    